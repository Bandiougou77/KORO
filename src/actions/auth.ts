"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { getPaysActif } from "@/lib/pays";
import { creerVerificationEntreprise } from "@/lib/verification";
import { loginSchema, registerCandidatSchema, registerEntrepriseSchema } from "@/lib/validation";
import type { ActionState } from "./types";

export async function registerCandidat(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerCandidatSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const data = parsed.data;

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  const motDePasseHash = await hashPassword(data.password);
  const pays = await getPaysActif();

  const user = await db.user.create({
    data: {
      role: "candidat",
      email: data.email,
      telephone: data.telephone || null,
      motDePasseHash,
      paysId: pays.id,
      profilCandidat: {
        create: {
          nom: data.nom,
          prenom: data.prenom,
          competences: data.competences || null,
          disponibilite: data.disponibilite,
          localisation: data.localisation || null,
          moyenPaiementPrefere: data.moyenPaiementPrefere || null,
          identifiantPaiement: data.identifiantPaiement || null,
        },
      },
    },
  });

  await createSession(user.id, "candidat");
  redirect("/moncompte");
}

export async function registerEntreprise(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerEntrepriseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const data = parsed.data;

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  const motDePasseHash = await hashPassword(data.password);
  const pays = await getPaysActif();

  const user = await db.user.create({
    data: {
      role: "entreprise",
      email: data.email,
      telephone: data.telephone || null,
      motDePasseHash,
      paysId: pays.id,
      entreprise: {
        create: {
          nomEntreprise: data.nomEntreprise,
          identifiantLegal: data.identifiantLegal || null,
          adresse: data.adresse || null,
          paysId: pays.id,
        },
      },
    },
  });

  await creerVerificationEntreprise(user.id, data.pieceIdentiteResponsable);

  await createSession(user.id, "entreprise");
  redirect("/entreprise/dashboard");
}

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.motDePasseHash))) {
    return { error: "Email ou mot de passe incorrect." };
  }
  if (user.compteSuspendu) {
    return { error: "Ce compte est suspendu le temps d'un examen. Contactez le support." };
  }

  await createSession(user.id, user.role);
  if (user.role === "entreprise") redirect("/entreprise/dashboard");
  if (user.role === "admin") redirect("/admin/revenus");
  redirect("/moncompte");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
