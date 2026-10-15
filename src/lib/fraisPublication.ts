import { db } from "@/lib/db";
import { assertTransitionAutorisee } from "@/lib/missionTransitions";
import type { Devise } from "@/generated/prisma/enums";

// Frontière d'isolation pour un futur prestataire réel, même principe que lib/payment.ts —
// aucun appel externe tant que les frais ne sont pas activés en production.

// Lit la configuration vivante (jamais modifiée rétroactivement : chaque changement insère
// une nouvelle ligne avec sa propre dateEffective, voir actions/admin.ts::definirFraisPublication).
export async function getFraisPublicationActif(paysId: string): Promise<{ actif: boolean; montant: number; devise: Devise | null }> {
  const config = await db.configFraisPublication.findFirst({
    where: { paysId, dateEffective: { lte: new Date() } },
    orderBy: { dateEffective: "desc" },
  });
  if (!config) return { actif: false, montant: 0, devise: null };
  return { actif: config.actif, montant: config.montant, devise: config.devise };
}

// Snapshot pris au moment de la création de la mission — indépendant de Paiement (commission
// sur la prestation) : deux revenus distincts, jamais mélangés.
export async function creerFraisPublicationPourMission(missionId: string, paysId: string, devise: Devise) {
  const { actif, montant } = await getFraisPublicationActif(paysId);
  return db.fraisPublication.create({
    data: {
      missionId,
      montant: actif ? montant : 0,
      devise,
      statut: actif ? "en_attente" : "gratuit",
    },
  });
}

// Recalcule le prix contre la configuration VIVANTE, jamais contre ce qui a été affiché avant —
// appelée à chaque rendu de l'écran de confirmation ET juste avant la confirmation finale, pour
// détecter un changement de prix survenu entre-temps (avertit l'entrepreneur plutôt que de
// publier silencieusement sur un prix périmé).
export async function rafraichirFraisPublicationSiChange(
  missionId: string,
  paysId: string,
): Promise<{ frais: Awaited<ReturnType<typeof db.fraisPublication.findUniqueOrThrow>>; aChange: boolean }> {
  const frais = await db.fraisPublication.findUniqueOrThrow({ where: { missionId } });
  if (frais.statut !== "en_attente" && frais.statut !== "gratuit") {
    // Déjà payé/échoué/remboursé : plus question de retoucher le montant appliqué.
    return { frais, aChange: false };
  }

  const live = await getFraisPublicationActif(paysId);
  const nouveauMontant = live.actif ? live.montant : 0;
  const nouveauStatut = live.actif ? ("en_attente" as const) : ("gratuit" as const);

  if (frais.montant === nouveauMontant && frais.statut === nouveauStatut) {
    return { frais, aChange: false };
  }

  const miseAJour = await db.fraisPublication.update({
    where: { missionId },
    data: { montant: nouveauMontant, statut: nouveauStatut },
  });
  return { frais: miseAJour, aChange: true };
}

// Confirme la publication : si gratuit, publie directement ; si payant, simule le paiement
// (même esprit que autoriserSequestre/libererSequestre) puis publie. Transaction atomique avec
// updateMany conditionné sur le statut courant — protège contre les doubles soumissions
// (double-clic, requête dupliquée) exactement comme lib/payment.ts et lib/solde.ts.
export async function confirmerPublication(missionId: string, paysId: string): Promise<void> {
  assertTransitionAutorisee("brouillon", "publiee");
  const { aChange } = await rafraichirFraisPublicationSiChange(missionId, paysId);
  if (aChange) {
    throw new Error("Le prix de publication a changé. Vérifiez le nouveau montant et confirmez à nouveau.");
  }

  const frais = await db.fraisPublication.findUniqueOrThrow({ where: { missionId } });

  await db.$transaction(async (tx) => {
    if (frais.statut === "gratuit") {
      const { count } = await tx.mission.updateMany({
        where: { id: missionId, statut: "brouillon" },
        data: { statut: "publiee" },
      });
      if (count === 0) {
        throw new Error("Cette mission a déjà été publiée.");
      }
      return;
    }

    const { count: countFrais } = await tx.fraisPublication.updateMany({
      where: { missionId, statut: "en_attente" },
      data: { statut: "paye", datePaiement: new Date() },
    });
    if (countFrais === 0) {
      throw new Error("Ce paiement a déjà été traité pour cette mission.");
    }

    const { count: countMission } = await tx.mission.updateMany({
      where: { id: missionId, statut: "brouillon" },
      data: { statut: "publiee" },
    });
    if (countMission === 0) {
      throw new Error("Cette mission a déjà été publiée.");
    }
  });
}
