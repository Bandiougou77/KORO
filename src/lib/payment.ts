import { db } from "@/lib/db";
import { calculerRepartition } from "@/lib/commission";
import { crediterSolde } from "@/lib/solde";
import { assertTransitionAutorisee } from "@/lib/missionTransitions";
import type { MoyenPaiement } from "@/generated/prisma/enums";

// 3 jours calendaires après que le prestataire a marqué la mission terminée — délai dont
// dispose l'entreprise pour valider ou ouvrir un litige. Centralisé ici : ne pas redéfinir
// cette constante ailleurs (voir missionsEnAttenteValidationAdmin ci-dessous).
export const DELAI_VALIDATION_MS = 3 * 24 * 60 * 60 * 1000;

// Frontière d'isolation pour le futur prestataire réel (Stripe Connect en zone euro,
// CinetPay/PayDunya en zone FCFA — le prestataire dépend du pays/moyenPaiement) :
// seul le corps de ces fonctions changera (appel API + webhook), rien côté appelants.

// Appelée au moment où l'entreprise accepte une candidature : le paiement est autorisé
// et séquestré immédiatement, la mission ne démarre jamais sur une simple promesse.
// La commission et les frais sont à la charge de l'entreprise (ajoutés par-dessus le montant
// convenu) — le prestataire reçoit toujours le montant intégral, voir lib/repartition.ts.
export async function autoriserSequestre(missionId: string, moyenPaiement: MoyenPaiement) {
  const mission = await db.mission.findUniqueOrThrow({ where: { id: missionId } });
  assertTransitionAutorisee(mission.statut, "paiement_securise");
  const { commission, frais, totalEntreprise, montantPrestataire } = calculerRepartition(
    mission.montantBrut,
    mission.tauxCommission,
  );

  await db.paiement.create({
    data: {
      missionId,
      devise: mission.devise,
      moyenPaiement,
      montantBrut: mission.montantBrut,
      commission,
      fraisPaiement: frais,
      montantTotalEntreprise: totalEntreprise,
      montantNetCandidat: montantPrestataire,
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
  if (!mission.paiement) {
    throw new Error("Aucun paiement séquestré à libérer pour cette mission.");
  }
  assertTransitionAutorisee(mission.statut, "payee");

  // updateMany conditionné sur le statut courant : une seule des requêtes concurrentes
  // (double-clic, double appel) peut faire passer le statut de retenu_en_sequestre à effectue —
  // les autres matchent 0 ligne et échouent proprement, évitant un double crédit du solde.
  const { count } = await db.paiement.updateMany({
    where: { missionId, statut: "retenu_en_sequestre" },
    data: { statut: "effectue", datePaiement: new Date() },
  });
  if (count === 0) {
    throw new Error("Aucun paiement séquestré à libérer pour cette mission.");
  }
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

// Conséquence financière d'un litige résolu en faveur de l'entreprise (totalement ou en
// partage) — voir actions/litiges.ts::resoudreLitige. Ne simule JAMAIS un vrai virement : marque
// uniquement le Paiement comme "rembourse" (jamais supprimé ni modifié dans ses montants
// d'origine, l'historique reste intact) et, en cas de partage, crédite la part convenue au
// prestataire via le solde existant — même mécanisme que crediterSolde ailleurs, pas de double
// système de paiement.
export async function rembourserEntreprise(missionId: string, montantVersePrestataire?: number): Promise<void> {
  const mission = await db.mission.findUniqueOrThrow({
    where: { id: missionId },
    include: { paiement: true },
  });
  if (!mission.paiement) {
    throw new Error("Aucun paiement séquestré à rembourser pour cette mission.");
  }
  assertTransitionAutorisee(mission.statut, "remboursee");

  const { count } = await db.paiement.updateMany({
    where: { missionId, statut: "retenu_en_sequestre" },
    data: { statut: "rembourse", datePaiement: new Date() },
  });
  if (count === 0) {
    throw new Error("Aucun paiement séquestré à rembourser pour cette mission (déjà traité ?).");
  }
  await db.mission.update({ where: { id: missionId }, data: { statut: "remboursee" } });

  if (montantVersePrestataire && montantVersePrestataire > 0) {
    const candidatureAcceptee = await db.candidature.findFirst({ where: { missionId, statut: "acceptee" } });
    if (candidatureAcceptee) {
      await crediterSolde(candidatureAcceptee.candidatId, montantVersePrestataire, mission.devise, missionId);
    }
  }
}

// Liste les missions dont le délai de validation (3 jours) est dépassé sans réponse de
// l'entreprise ni litige ouvert. AUCUN versement n'est déclenché automatiquement ici — contrairement
// à l'ancien comportement, le dépassement du délai ne libère plus les fonds tout seul : un admin
// doit trancher (voir src/app/admin/validations). Le but n'est plus "agir", juste "signaler".
export async function missionsEnAttenteValidationAdmin() {
  const seuil = new Date(Date.now() - DELAI_VALIDATION_MS);

  return db.mission.findMany({
    where: { statut: "terminee", dateTerminee: { lt: seuil }, litige: null },
    include: { entreprise: true, paiement: true },
    orderBy: { dateTerminee: "asc" },
  });
}
