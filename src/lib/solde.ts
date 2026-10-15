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
  if (!Number.isFinite(montant) || montant <= 0) {
    throw new Error("Montant de retrait invalide.");
  }

  // Tout l'enchaînement (réservation du solde, création du retrait, écriture du mouvement)
  // est fait dans une seule transaction : si une étape échoue après la réservation, SQLite
  // annule tout, le solde réservé est restauré — pas de décrément orphelin sans écriture
  // correspondante.
  return db.$transaction(async (tx) => {
    // SQLite/libSQL n'a pas de MVCC ni de niveaux d'isolation façon Postgres : chaque
    // instruction d'écriture est sérialisée par le moteur. Conditionner le UPDATE lui-même
    // sur le solde courant (`montantDisponible >= montant`) rend la vérification et la
    // réservation atomiques en une seule instruction SQL — deux retraits concurrents ne
    // peuvent pas tous les deux réussir si leur somme dépasse le solde disponible, même si
    // les deux ont lu le même solde initial (même raisonnement que la correction de
    // libererSequestre dans lib/payment.ts, adapté : ici on conditionne sur une quantité
    // numérique, pas sur un statut).
    const { count } = await tx.solde.updateMany({
      where: { candidatId, montantDisponible: { gte: montant } },
      data: { montantDisponible: { decrement: montant }, dateMaj: new Date() },
    });
    if (count === 0) {
      throw new Error("Solde insuffisant pour ce retrait.");
    }

    // La destination du retrait est toujours celle déclarée au profil, jamais un champ libre —
    // sinon un compte compromis (ou un circuit de blanchiment) pourrait vider le solde vers
    // n'importe quel numéro tiers. Voir [[koro-securite-sequestre]].
    const profil = await tx.profilCandidat.findUniqueOrThrow({ where: { userId: candidatId } });
    if (!profil.moyenPaiementPrefere || !profil.identifiantPaiement) {
      throw new Error("Complétez votre moyen de paiement dans votre profil avant de retirer de l'argent.");
    }

    const solde = await tx.solde.findUniqueOrThrow({ where: { candidatId } });

    const retrait = await tx.retrait.create({
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

    await tx.mouvementSolde.create({
      data: { soldeId: candidatId, type: "debit_retrait", montant, retraitId: retrait.id },
    });

    return retrait;
  });
}
