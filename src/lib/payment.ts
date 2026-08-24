import { db } from "@/lib/db";
import { calculerRepartition } from "@/lib/commission";
import { crediterSolde } from "@/lib/solde";
import type { MoyenPaiement } from "@/generated/prisma/enums";

const DELAI_LIBERATION_MS = 48 * 60 * 60 * 1000;

// Frontière d'isolation pour le futur prestataire réel (Stripe Connect en zone euro,
// CinetPay/PayDunya en zone FCFA — le prestataire dépend du pays/moyenPaiement) :
// seul le corps de ces fonctions changera (appel API + webhook), rien côté appelants.

// Appelée au moment où l'entreprise accepte une candidature : le paiement est autorisé
// et séquestré immédiatement, la mission ne démarre jamais sur une simple promesse.
export async function autoriserSequestre(missionId: string, moyenPaiement: MoyenPaiement) {
  const mission = await db.mission.findUniqueOrThrow({ where: { id: missionId } });
  const { commission, frais, net } = calculerRepartition(mission.montantBrut, mission.tauxCommission);

  await db.paiement.create({
    data: {
      missionId,
      devise: mission.devise,
      moyenPaiement,
      montantBrut: mission.montantBrut,
      commission,
      fraisPaiement: frais,
      montantNetCandidat: net,
      statut: "retenu_en_sequestre",
      datePaiement: null,
      referencePrestatairePaiement: null,
    },
  });

  await db.mission.update({ where: { id: missionId }, data: { statut: "paiement_securise" } });
}

// Libère un paiement séquestré : soit l'entreprise confirme explicitement, soit le délai
// de contestation est dépassé sans litige (voir liberationsAutomatiquesEnRetard).
export async function libererSequestre(missionId: string) {
  const mission = await db.mission.findUniqueOrThrow({
    where: { id: missionId },
    include: { paiement: true },
  });
  if (!mission.paiement || mission.paiement.statut !== "retenu_en_sequestre") {
    throw new Error("Aucun paiement séquestré à libérer pour cette mission.");
  }

  await db.paiement.update({
    where: { missionId },
    data: { statut: "effectue", datePaiement: new Date() },
  });
  await db.mission.update({ where: { id: missionId }, data: { statut: "payee" } });

  const candidatureAcceptee = await db.candidature.findFirst({
    where: { missionId, statut: "acceptee" },
  });
  if (candidatureAcceptee) {
    await crediterSolde(
      candidatureAcceptee.candidatId,
      mission.paiement.montantNetCandidat,
      mission.devise,
      missionId,
    );
  }
}

// Simule la libération automatique après 48h sans contestation : pas de vraie tâche
// planifiée dans ce projet, donc appelée en tête des pages qui affichent des missions
// (dashboard entreprise, mon compte candidat) — vérification "à la consultation".
export async function liberationsAutomatiquesEnRetard(): Promise<void> {
  const seuil = new Date(Date.now() - DELAI_LIBERATION_MS);

  const missions = await db.mission.findMany({
    where: { statut: "terminee", dateTerminee: { lt: seuil }, litige: null },
    select: { id: true },
  });

  for (const mission of missions) {
    await libererSequestre(mission.id).catch(() => {});
  }
}
