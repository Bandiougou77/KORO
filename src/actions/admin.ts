"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { libererSequestre } from "@/lib/payment";
import { db } from "@/lib/db";
import { definirFraisPublicationSchema } from "@/lib/validation";
import type { ActionState } from "./types";

// Remplace l'ancienne libération automatique après le délai de validation (3 jours) : un admin
// examine manuellement chaque mission en attente avant de débloquer le versement. Voir
// src/lib/payment.ts::missionsEnAttenteValidationAdmin pour la liste affichée côté page.
export async function libererParAdmin(
  missionId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  await requireRole("admin");

  // Défense explicite, indépendante de missionsEnAttenteValidationAdmin() (qui exclut déjà les
  // litiges de sa liste) : même appelée directement avec un missionId arbitraire, cette action
  // ne doit jamais pouvoir libérer un paiement tant qu'un litige n'est pas résolu. Seule la
  // résolution de litige elle-même (lib/litiges.ts) peut déclencher un versement dans ce cas.
  const litige = await db.litige.findUnique({ where: { missionId } });
  if (litige && litige.statut !== "resolu") {
    return { error: "Un litige est ouvert sur cette mission — résolvez-le avant de libérer le paiement." };
  }

  try {
    await libererSequestre(missionId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Libération impossible." };
  }

  revalidatePath("/admin/validations");
  return {};
}

// N'écrase jamais une configuration existante — insère toujours une nouvelle ligne
// (dateEffective = maintenant) : les missions déjà en brouillon/publiées gardent le prix
// qu'elles ont déjà snapshotté (voir lib/fraisPublication.ts), rien n'est rétroactif.
export async function definirFraisPublication(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin");

  const parsed = definirFraisPublicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const pays = await db.pays.findUniqueOrThrow({ where: { id: parsed.data.paysId } });

  await db.configFraisPublication.create({
    data: {
      paysId: parsed.data.paysId,
      actif: parsed.data.actif,
      montant: parsed.data.montant,
      devise: pays.devise,
    },
  });

  revalidatePath("/admin/configuration");
  return {};
}
