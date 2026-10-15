"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getTauxCommission } from "@/lib/commission";
import { entrepriseEstVerifiee } from "@/lib/verification";
import { creerFraisPublicationPourMission, confirmerPublication } from "@/lib/fraisPublication";
import { assertTransitionAutorisee } from "@/lib/missionTransitions";
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

  // "brouillon" : la mission n'est visible nulle part publiquement tant que la publication
  // n'est pas confirmée (gratuite ou payée) — voir confirmerPublicationMission ci-dessous.
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
      statut: "brouillon",
    },
  });

  // Snapshot des frais de publication applicables MAINTENANT — indépendant de la commission
  // (Paiement), jamais mélangé. Voir lib/fraisPublication.ts.
  await creerFraisPublicationPourMission(mission.id, entreprise.paysId, entreprise.pays.devise);

  redirect(`/publier/${mission.id}/confirmer`);
}

// Dernière étape avant publication réelle : affiche/recalcule le prix de publication côté
// serveur (jamais le montant envoyé par le navigateur) et ne publie que si le prix affiché est
// toujours celui en vigueur — voir lib/fraisPublication.ts::confirmerPublication.
export async function confirmerPublicationMission(
  missionId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const session = await requireRole("entreprise");

  const mission = await db.mission.findUniqueOrThrow({ where: { id: missionId } });
  if (mission.entrepriseId !== session.userId) {
    return { error: "Vous ne pouvez pas publier cette mission." };
  }
  if (mission.statut !== "brouillon") {
    return { error: "Cette mission n'est plus en attente de publication." };
  }

  try {
    await confirmerPublication(missionId, mission.paysId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Publication impossible." };
  }

  revalidatePath("/offres");
  revalidatePath("/entreprise/dashboard");
  redirect(`/offres/${missionId}`);
}

export async function cancelMission(
  missionId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const session = await requireRole("entreprise");

  const mission = await db.mission.findUniqueOrThrow({ where: { id: missionId } });
  if (mission.entrepriseId !== session.userId) {
    return { error: "Vous ne pouvez pas annuler cette mission." };
  }
  // Transition centralisée (src/lib/missionTransitions.ts) : une mission ne peut plus être
  // annulée dès qu'un paiement est séquestré ou en cours de traitement — pas seulement "payee"
  // comme avant (le garde-fou historique était trop permissif : une mission en litige ou déjà
  // séquestrée ne devrait jamais pouvoir être annulée directement).
  try {
    assertTransitionAutorisee(mission.statut, "annulee");
  } catch {
    return { error: "Cette mission ne peut plus être annulée dans son état actuel." };
  }

  await db.mission.update({ where: { id: missionId }, data: { statut: "annulee" } });
  revalidatePath("/offres");
  revalidatePath("/entreprise/dashboard");
  return {};
}
