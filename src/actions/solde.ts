"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { effectuerRetrait } from "@/lib/solde";
import { retraitSchema } from "@/lib/validation";
import type { ActionState } from "./types";

export async function demanderRetrait(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("candidat");

  const parsed = retraitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  try {
    await effectuerRetrait(
      session.userId,
      parsed.data.montant,
      parsed.data.moyenRetrait,
      parsed.data.identifiantDestinataire,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Retrait impossible." };
  }

  revalidatePath("/moncompte/solde");
  revalidatePath("/moncompte");
  return {};
}
