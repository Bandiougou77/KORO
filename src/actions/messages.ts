"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { messageSchema } from "@/lib/validation";
import type { ActionState } from "./types";

async function verifierParticipant(missionId: string, userId: string) {
  const mission = await db.mission.findUniqueOrThrow({
    where: { id: missionId },
    include: { candidatures: { where: { statut: "acceptee" } } },
  });
  const estEntreprise = mission.entrepriseId === userId;
  const estCandidatAccepte = mission.candidatures.some((c) => c.candidatId === userId);
  if (!estEntreprise && !estCandidatAccepte) {
    throw new Error("Vous n'êtes pas partie prenante de cette mission.");
  }
}

export async function envoyerMessage(
  missionId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Vous devez être connecté." };

  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Message invalide" };
  }

  try {
    await verifierParticipant(missionId, session.userId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Accès refusé." };
  }

  await db.messageInterne.create({
    data: { missionId, expediteurId: session.userId, contenu: parsed.data.contenu },
  });

  revalidatePath("/entreprise/dashboard");
  revalidatePath("/moncompte");
  return {};
}
