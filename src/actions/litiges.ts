"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";
import { libererSequestre, rembourserEntreprise } from "@/lib/payment";
import { assertTransitionAutorisee } from "@/lib/missionTransitions";
import { litigeSchema, resolutionLitigeSchema, demandeInformationsLitigeSchema } from "@/lib/validation";
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
  if (mission.litige) {
    return { error: "Un litige est déjà ouvert sur cette mission." };
  }
  try {
    assertTransitionAutorisee(mission.statut, "litige");
  } catch {
    return { error: "Cette mission ne peut plus être contestée." };
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
  revalidatePath("/admin/litiges");
  return {};
}

// Admin uniquement : demande des précisions à une partie avant de trancher. Réutilise la
// messagerie interne existante (MessageInterne) plutôt que de construire un canal séparé.
export async function demanderInformationsLitige(
  litigeId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("admin");

  const parsed = demandeInformationsLitigeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Message invalide" };
  }

  const litige = await db.litige.findUniqueOrThrow({ where: { id: litigeId } });
  if (litige.statut === "resolu") {
    return { error: "Ce litige est déjà résolu." };
  }

  await db.$transaction([
    db.litige.update({ where: { id: litigeId }, data: { statut: "informations_demandees" } }),
    db.messageInterne.create({
      data: {
        missionId: litige.missionId,
        expediteurId: session.userId,
        contenu: `[Équipe Kôrô — demande d'informations complémentaires sur le litige] ${parsed.data.message}`,
      },
    }),
  ]);

  revalidatePath("/admin/litiges");
  revalidatePath(`/admin/litiges/${litigeId}`);
  return {};
}

// Admin uniquement : tranche le litige. Les quatre issues possibles sont celles déjà prévues
// par DecisionLitige (prisma/schema.prisma) — rien n'est inventé ici, juste enfin câblé.
// Chaque décision est historisée (motif, admin, horodatage) et ses conséquences financières
// éventuelles passent par les mêmes briques simulées que le reste du projet (jamais un vrai
// virement tant qu'aucun prestataire réel n'est intégré).
export async function resoudreLitige(
  litigeId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("admin");

  const parsed = resolutionLitigeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { decision, motifDecision, utilisateurASuspendre } = parsed.data;
  const montantPartage =
    parsed.data.montantVersePrestataire === "" || parsed.data.montantVersePrestataire === undefined
      ? undefined
      : Number(parsed.data.montantVersePrestataire);

  const litige = await db.litige.findUniqueOrThrow({
    where: { id: litigeId },
    include: { mission: { include: { candidatures: { where: { statut: "acceptee" } } } } },
  });

  // Mise à jour conditionnée sur "pas déjà résolu" : protège contre deux admins (ou un
  // double-clic) qui tenteraient de trancher le même litige simultanément.
  const { count } = await db.litige.updateMany({
    where: { id: litigeId, statut: { not: "resolu" } },
    data: {
      statut: "resolu",
      decision,
      motifDecision,
      resoluParId: session.userId,
      dateResolution: new Date(),
      montantRembourseEntreprise: decision === "remboursement_entreprise" || decision === "partage" ? 0 : null,
      montantVersePrestataire: decision === "partage" && montantPartage !== undefined ? montantPartage : null,
    },
  });
  if (count === 0) {
    return { error: "Ce litige a déjà été résolu." };
  }

  try {
    if (decision === "paiement_candidat") {
      await libererSequestre(litige.missionId);
    } else if (decision === "remboursement_entreprise") {
      await rembourserEntreprise(litige.missionId);
    } else if (decision === "partage") {
      await rembourserEntreprise(litige.missionId, montantPartage);
    } else if (decision === "compte_suspendu") {
      const candidatureAcceptee = litige.mission.candidatures[0];
      const ciblesPossibles = [litige.mission.entrepriseId, candidatureAcceptee?.candidatId].filter(Boolean);
      if (utilisateurASuspendre && ciblesPossibles.includes(utilisateurASuspendre)) {
        await db.user.update({ where: { id: utilisateurASuspendre }, data: { compteSuspendu: true } });
      }
      // Pas de versement ni de remboursement dans ce cas — la mission sort simplement du litige
      // sans mouvement financier, voir missionTransitions.ts (litige -> terminee autorisé).
      assertTransitionAutorisee(litige.mission.statut, "terminee");
      await db.mission.update({ where: { id: litige.missionId }, data: { statut: "terminee" } });
    }
  } catch (e) {
    // La décision est déjà enregistrée (historique préservé) même si la conséquence financière
    // échoue — on signale l'erreur sans jamais revenir sur l'historique de la décision elle-même.
    return { error: e instanceof Error ? e.message : "Décision enregistrée, mais son application a échoué." };
  }

  revalidatePath("/admin/litiges");
  revalidatePath(`/admin/litiges/${litigeId}`);
  revalidatePath("/entreprise/dashboard");
  revalidatePath("/moncompte");
  return {};
}
