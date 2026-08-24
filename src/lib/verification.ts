import { db } from "@/lib/db";

// Vérification entreprise simulée : validée automatiquement et instantanément, comme le
// reste des flux de paiement de ce projet (pas de vraie vérification humaine en phase 1).
// Le contrôle dans createMission reste un vrai contrôle fonctionnel : si un jour cette
// validation cesse d'être automatique, le blocage marchera déjà sans rien changer ailleurs.
export async function creerVerificationEntreprise(
  entrepriseId: string,
  documentReference: string,
): Promise<void> {
  await db.verification.create({
    data: {
      entrepriseId,
      type: "identite_entreprise",
      statut: "validee",
      documentReference,
      dateVerification: new Date(),
    },
  });
}

export async function entrepriseEstVerifiee(entrepriseId: string): Promise<boolean> {
  const verification = await db.verification.findFirst({
    where: { entrepriseId, statut: "validee" },
  });
  return verification !== null;
}
