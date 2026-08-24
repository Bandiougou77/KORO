"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { effectuerVirementCommission } from "@/lib/revenus";
import { virementCommissionSchema } from "@/lib/validation";
import type { ActionState } from "./types";

export async function transfererCommission(
  paysId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin");

  const parsed = virementCommissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  try {
    await effectuerVirementCommission(paysId, parsed.data.compteBancaireId, parsed.data.montant);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Virement impossible." };
  }

  revalidatePath("/admin/revenus");
  return {};
}
