"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { autoriserSequestre } from "@/lib/payment";
import { entrepriseEstVerifiee } from "@/lib/verification";
import { applyCandidatureSchema, acceptCandidatureSchema } from "@/lib/validation";
import type { ActionState } from "./types";

export async function applyCandidature(
  missionId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("candidat");

  const parsed = applyCandidatureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const mission = await db.mission.findUnique({ where: { id: missionId } });
  if (!mission || mission.statut !== "publiee") {
    return { error: "Cette mission n'accepte plus de candidatures." };
  }

  let candidature;
  try {
    candidature = await db.candidature.create({
      data: {
        missionId,
        candidatId: session.userId,
        message: parsed.data.message || null,
      },
    });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") {
      return { error: "Vous avez déjà postulé à cette mission." };
    }
    throw e;
  }

  revalidatePath("/moncompte");
  redirect(`/candidature/${candidature.id}/envoyee`);
}

export async function acceptCandidature(
  candidatureId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("entreprise");

  const parsed = acceptCandidatureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Choisissez un moyen de paiement." };
  }

  const candidature = await db.candidature.findUniqueOrThrow({
    where: { id: candidatureId },
    include: { mission: true },
  });
  if (candidature.mission.entrepriseId !== session.userId) {
    return { error: "Vous ne pouvez pas modifier cette candidature." };
  }
  if (candidature.mission.statut !== "publiee") {
    return { error: "Cette mission n'est plus ouverte aux candidatures." };
  }
  if (!(await entrepriseEstVerifiee(session.userId))) {
    return { error: "Votre compte entreprise est en cours de vérification." };
  }

  await db.$transaction([
    db.candidature.update({ where: { id: candidatureId }, data: { statut: "acceptee" } }),
    db.candidature.updateMany({
      where: { missionId: candidature.missionId, statut: "envoyee", id: { not: candidatureId } },
      data: { statut: "declinee" },
    }),
  ]);

  // Le paiement est autorisé et séquestré immédiatement, dans le même geste que l'acceptation —
  // pas de bouton "Payer" séparé plus tard : voir lib/payment.ts.
  await autoriserSequestre(candidature.missionId, parsed.data.moyenPaiement);

  revalidatePath("/entreprise/dashboard");
  revalidatePath("/moncompte");
  return {};
}

export async function declineCandidature(candidatureId: string): Promise<void> {
  const session = await requireRole("entreprise");

  const candidature = await db.candidature.findUniqueOrThrow({
    where: { id: candidatureId },
    include: { mission: true },
  });
  if (candidature.mission.entrepriseId !== session.userId) {
    throw new Error("Vous ne pouvez pas modifier cette candidature.");
  }

  await db.candidature.update({ where: { id: candidatureId }, data: { statut: "declinee" } });

  revalidatePath("/entreprise/dashboard");
  revalidatePath("/moncompte");
}

export async function marquerMissionTerminee(missionId: string): Promise<void> {
  const session = await requireRole("candidat");

  const candidature = await db.candidature.findFirst({
    where: { missionId, candidatId: session.userId, statut: "acceptee" },
    include: { mission: true },
  });
  if (!candidature) {
    throw new Error("Vous n'êtes pas le candidat retenu pour cette mission.");
  }
  if (candidature.mission.statut !== "paiement_securise") {
    throw new Error("Cette mission ne peut pas être marquée comme terminée dans son état actuel.");
  }

  await db.mission.update({
    where: { id: missionId },
    data: { statut: "terminee", dateTerminee: new Date() },
  });

  revalidatePath("/moncompte");
  revalidatePath("/entreprise/dashboard");
}
