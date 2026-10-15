"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { getPaysActif } from "@/lib/pays";
import { creerVerificationEntreprise } from "@/lib/verification";
import { creerTokenReset, reinitialiserMotDePasse } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/email";
import { verifierLimiteConnexion } from "@/lib/rateLimiter";
import { getClientIp } from "@/lib/clientIp";
import {
  loginSchema,
  registerCandidatSchema,
  registerEntrepriseSchema,
  demanderResetSchema,
  resetPasswordSchema,
} from "@/lib/validation";
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

  await createSession(user.id, "candidat", user.tokenVersion);
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

  await createSession(user.id, "entreprise", user.tokenVersion);
  redirect("/entreprise/dashboard");
}

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { email, password } = parsed.data;

  // Calculée sur l'email soumis AVANT toute recherche en base — voir lib/rateLimiter.ts.
  const ip = await getClientIp();
  const resultatLimite = await verifierLimiteConnexion(ip, email);
  if (!resultatLimite.autorise) {
    if (resultatLimite.raison === "service_indisponible") {
      return { error: "Service temporairement indisponible. Réessayez dans un instant." };
    }
    return { error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.motDePasseHash))) {
    return { error: "Email ou mot de passe incorrect." };
  }
  if (user.compteSuspendu) {
    return { error: "Ce compte est suspendu le temps d'un examen. Contactez le support." };
  }

  await createSession(user.id, user.role, user.tokenVersion);
  if (user.role === "entreprise") redirect("/entreprise/dashboard");
  if (user.role === "admin") redirect("/admin/revenus");
  redirect("/moncompte");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

// Réponse volontairement identique que l'email existe ou non (anti-énumération) —
// voir lib/passwordReset.ts pour la génération du token.
export async function demanderResetMotDePasse(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = demanderResetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email invalide" };
  }

  const token = await creerTokenReset(parsed.data.email);
  if (token) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reinitialiser-mot-de-passe?token=${token}`;
    await sendPasswordResetEmail(parsed.data.email, resetUrl).catch(() => {});
  }

  return { error: undefined, success: true };
}

export async function resetMotDePasse(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  try {
    await reinitialiserMotDePasse(parsed.data.token, parsed.data.password);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Réinitialisation impossible." };
  }

  redirect("/connexion");
}
