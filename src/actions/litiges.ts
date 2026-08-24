"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { litigeSchema } from "@/lib/validation";
import type { ActionState } from "./types";

export async function ouvrirLitige(
  missionId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Vous devez être connecté." };

  const parsed = litigeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const mission = await db.mission.findUniqueOrThrow({
    where: { id: missionId },
    include: { candidatures: { where: { statut: "acceptee" } }, litige: true },
  });

  const estEntreprise = mission.entrepriseId === session.userId;
  const estCandidatAccepte = mission.candidatures.some((c) => c.candidatId === session.userId);
  if (!estEntreprise && !estCandidatAccepte) {
    return { error: "Vous n'êtes pas partie prenante de cette mission." };
  }
  if (mission.statut === "payee" || mission.statut === "annulee") {
    return { error: "Cette mission ne peut plus être contestée." };
  }
  if (mission.litige) {
    return { error: "Un litige est déjà ouvert sur cette mission." };
  }

  await db.$transaction([
    db.litige.create({
      data: {
        missionId,
        ouvertParId: session.userId,
        motif: parsed.data.motif,
        elementsFournis: parsed.data.description,
      },
    }),
    db.mission.update({ where: { id: missionId }, data: { statut: "litige" } }),
  ]);

  revalidatePath("/entreprise/dashboard");
  revalidatePath("/moncompte");
  return {};
}
