import { db } from "@/lib/db";
import type { Devise } from "@/generated/prisma/enums";

export type ApercuRevenusPays = {
  paysId: string;
  paysNom: string;
  devise: Devise;
  gmv: number;
  commissionCollectee: number;
  commissionVirée: number;
  commissionDisponible: number;
};

// GMV (volume total des missions payées) et commission réelle ne doivent jamais être
// confondus dans le même chiffre — voir additif §4.
//
// Attribution par pays via mission.paysId (pas par devise) : plusieurs pays peuvent
// partager la même devise (Mali/Sénégal/Côte d'Ivoire sont tous en FCFA), donc grouper
// par devise mélangerait leurs revenus. On agrège en mémoire plutôt qu'avec un groupBy
// Prisma, qui ne peut pas grouper par un champ d'un modèle lié.
export async function getApercuRevenus(): Promise<ApercuRevenusPays[]> {
  const paiements = await db.paiement.findMany({
    where: { statut: "effectue" },
    select: { montantBrut: true, commission: true, mission: { select: { paysId: true } } },
  });

  const virements = await db.virementCommission.findMany({
    where: { statut: "recu" },
    select: { paysId: true, montant: true },
  });

  const pays = await db.pays.findMany();

  const resultats: ApercuRevenusPays[] = [];
  for (const p of pays) {
    const paiementsDuPays = paiements.filter((pm) => pm.mission.paysId === p.id);
    const gmv = paiementsDuPays.reduce((total, pm) => total + pm.montantBrut, 0);
    const commissionCollectee = paiementsDuPays.reduce((total, pm) => total + pm.commission, 0);
    if (gmv === 0 && commissionCollectee === 0) continue;

    const commissionVirée = virements
      .filter((v) => v.paysId === p.id)
      .reduce((total, v) => total + v.montant, 0);

    resultats.push({
      paysId: p.id,
      paysNom: p.nom,
      devise: p.devise,
      gmv,
      commissionCollectee,
      commissionVirée,
      commissionDisponible: Math.round((commissionCollectee - commissionVirée) * 100) / 100,
    });
  }

  return resultats;
}

export async function effectuerVirementCommission(
  paysId: string,
  compteBancaireId: string,
  montant: number,
): Promise<void> {
  const compte = await db.compteBancaireAdmin.findUniqueOrThrow({ where: { id: compteBancaireId } });
  if (compte.paysId !== paysId) {
    throw new Error("Ce compte bancaire ne correspond pas à ce pays.");
  }

  const apercu = await getApercuRevenus();
  const ligne = apercu.find((a) => a.paysId === paysId);
  if (!ligne || montant > ligne.commissionDisponible) {
    throw new Error("Montant supérieur à la commission disponible.");
  }

  await db.virementCommission.create({
    data: {
      paysId,
      devise: compte.devise,
      montant,
      compteBancaireId,
      // Simulé : instantané, comme le reste des flux de paiement de ce projet.
      statut: "recu",
      dateTraitement: new Date(),
    },
  });
}
