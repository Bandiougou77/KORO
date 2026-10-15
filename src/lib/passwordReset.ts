import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const TOKEN_DUREE_MS = 30 * 60 * 1000; // 30 minutes

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Retourne le token en clair (à mettre dans l'email) uniquement si un compte existe pour
// cet email — l'appelant doit renvoyer la même réponse générique dans les deux cas pour
// ne pas révéler si une adresse est inscrite (anti-énumération).
export async function creerTokenReset(email: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;

  const token = randomBytes(32).toString("base64url");

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_DUREE_MS),
    },
  });

  return token;
}

export async function reinitialiserMotDePasse(token: string, nouveauMotDePasse: string): Promise<void> {
  const tokenHash = hashToken(token);

  const resetToken = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new Error("Ce lien de réinitialisation est invalide ou expiré.");
  }

  const motDePasseHash = await hashPassword(nouveauMotDePasse);

  await db.$transaction([
    db.user.update({
      where: { id: resetToken.userId },
      data: { motDePasseHash, tokenVersion: { increment: 1 } },
    }),
    db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    // Un seul lien utilisable à la fois : toute autre demande en attente pour ce compte
    // devient caduque dès qu'une réinitialisation aboutit.
    db.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId, id: { not: resetToken.id }, usedAt: null },
    }),
  ]);
}
