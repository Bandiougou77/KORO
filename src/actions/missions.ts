"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getTauxCommission } from "@/lib/commission";
import { entrepriseEstVerifiee } from "@/lib/verification";
import { createMissionSchema } from "@/lib/validation";
import type { ActionState } from "./types";

export async function createMission(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("entreprise");

  if (!(await entrepriseEstVerifiee(session.userId))) {
    return { error: "Votre compte entreprise est en cours de vérification. Vous pourrez publier dès qu'il sera validé." };
  }

  const parsed = createMissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const data = parsed.data;

  const entreprise = await db.entreprise.findUniqueOrThrow({
    where: { userId: session.userId },
    include: { pays: true },
  });
  const taux = await getTauxCommission(entreprise.paysId, data.dureeType);

  const mission = await db.mission.create({
    data: {
      entrepriseId: session.userId,
      paysId: entreprise.paysId,
      titre: data.titre,
      description: data.description,
      mode: data.mode,
      lieu: data.lieu || null,
      dureeType: data.dureeType,
      dateDebut: data.dateDebut ? new Date(data.dateDebut) : null,
      dateFin: data.dateFin ? new Date(data.dateFin) : null,
      typeTarif: data.typeTarif,
      montantBrut: data.montantBrut,
      devise: entreprise.pays.devise,
      tauxCommission: taux,
      statut: "publiee",
    },
  });

  revalidatePath("/offres");
  revalidatePath("/entreprise/dashboard");
  redirect(`/offres/${mission.id}`);
}

export async function cancelMission(missionId: string): Promise<void> {
  const session = await requireRole("entreprise");

  const mission = await db.mission.findUniqueOrThrow({ where: { id: missionId } });
  if (mission.entrepriseId !== session.userId) {
    throw new Error("Vous ne pouvez pas annuler cette mission.");
  }
  if (mission.statut === "payee") {
    throw new Error("Impossible d'annuler une mission déjà payée.");
  }

  await db.mission.update({ where: { id: missionId }, data: { statut: "annulee" } });
  revalidatePath("/offres");
  revalidatePath("/entreprise/dashboard");
}
