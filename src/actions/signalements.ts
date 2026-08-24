"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { signalementSchema } from "@/lib/validation";
import type { ActionState } from "./types";

export async function creerSignalement(
  cibleId: string,
  missionId: string | null,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Vous devez être connecté." };
  if (cibleId === session.userId) return { error: "Vous ne pouvez pas vous signaler vous-même." };

  const parsed = signalementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const cible = await db.user.findUniqueOrThrow({ where: { id: cibleId } });

  await db.signalement.create({
    data: {
      auteurId: session.userId,
      cibleId,
      missionId,
      motif: parsed.data.motif,
      description: parsed.data.description,
    },
  });

  // Suspension immédiate d'un compte candidat signalé pour menace/extorsion, le temps
  // qu'un examen humain ait lieu (pas encore de back-office pour ça — voir §2.3 de l'additif).
  if (parsed.data.motif === "menace_extorsion" && cible.role === "candidat") {
    await db.user.update({ where: { id: cibleId }, data: { compteSuspendu: true } });
  }

  revalidatePath("/entreprise/dashboard");
  revalidatePath("/offres");
  return {};
}
