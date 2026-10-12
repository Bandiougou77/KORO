"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { libererSequestre } from "@/lib/payment";
import type { ActionState } from "./types";

// Libère un paiement séquestré une fois que le candidat a marqué la mission comme terminée —
// l'entreprise confirme explicitement au lieu d'attendre la libération automatique à 48h
// (voir lib/payment.ts::liberationsAutomatiquesEnRetard).
export async function confirmerEtLibererPaiement(
  missionId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const session = await requireRole("entreprise");

  const mission = await db.mission.findUniqueOrThrow({ where: { id: missionId } });
  if (mission.entrepriseId !== session.userId) {
    return { error: "Vous ne pouvez pas confirmer cette mission." };
  }
  if (mission.statut !== "terminee") {
    return { error: "Cette mission n'est pas prête à être confirmée." };
  }

  try {
    await libererSequestre(missionId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Impossible de libérer le paiement." };
  }

  revalidatePath("/entreprise/dashboard");
  revalidatePath("/moncompte");
  return {};
}
