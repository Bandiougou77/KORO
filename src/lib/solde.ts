import { db } from "@/lib/db";
import type { Devise } from "@/generated/prisma/enums";

export async function crediterSolde(
  candidatId: string,
  montant: number,
  devise: Devise,
  missionId: string,
): Promise<void> {
  const solde = await db.solde.upsert({
    where: { candidatId },
    create: { candidatId, montantDisponible: montant, devise },
    update: { montantDisponible: { increment: montant }, dateMaj: new Date() },
  });

  await db.mouvementSolde.create({
    data: { soldeId: solde.candidatId, type: "credit_mission", montant, missionId },
  });
}

export async function effectuerRetrait(candidatId: string, montant: number) {
  const solde = await db.solde.findUnique({ where: { candidatId } });
  if (!solde || montant > solde.montantDisponible) {
    throw new Error("Solde insuffisant pour ce retrait.");
  }

  // La destination du retrait est toujours celle déclarée au profil, jamais un champ libre —
  // sinon un compte compromis (ou un circuit de blanchiment) pourrait vider le solde vers
  // n'importe quel numéro tiers. Voir [[koro-securite-sequestre]].
  const profil = await db.profilCandidat.findUniqueOrThrow({ where: { userId: candidatId } });
  if (!profil.moyenPaiementPrefere || !profil.identifiantPaiement) {
    throw new Error("Complétez votre moyen de paiement dans votre profil avant de retirer de l'argent.");
  }

  const retrait = await db.retrait.create({
    data: {
      candidatId,
      montant,
      devise: solde.devise,
      moyenRetrait: profil.moyenPaiementPrefere,
      identifiantDestinataire: profil.identifiantPaiement,
      // Simulé : traité instantanément, comme processPayment (pas de prestataire réel en phase 1).
      statut: "recu",
      dateTraitement: new Date(),
    },
  });

  await db.solde.update({
    where: { candidatId },
    data: { montantDisponible: { decrement: montant }, dateMaj: new Date() },
  });

  await db.mouvementSolde.create({
    data: { soldeId: candidatId, type: "debit_retrait", montant, retraitId: retrait.id },
  });

  return retrait;
}
