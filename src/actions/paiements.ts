"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { libererSequestre } from "@/lib/payment";

// Libère un paiement séquestré une fois que le candidat a marqué la mission comme terminée —
// l'entreprise confirme explicitement au lieu d'attendre la libération automatique à 48h
// (voir lib/payment.ts::liberationsAutomatiquesEnRetard).
export async function confirmerEtLibererPaiement(missionId: string): Promise<void> {
  const session = await requireRole("entreprise");

  const mission = await db.mission.findUniqueOrThrow({ where: { id: missionId } });
  if (mission.entrepriseId !== session.userId) {
    throw new Error("Vous ne pouvez pas confirmer cette mission.");
  }
  if (mission.statut !== "terminee") {
    throw new Error("Cette mission n'est pas prête à être confirmée.");
  }

  await libererSequestre(missionId);

  revalidatePath("/entreprise/dashboard");
  revalidatePath("/moncompte");
}
