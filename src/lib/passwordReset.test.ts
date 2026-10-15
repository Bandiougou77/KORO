import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { creerTokenReset, reinitialiserMotDePasse } from "@/lib/passwordReset";
import { creerPaysTest, creerCandidatTest } from "@/lib/testFixtures";

describe("creerTokenReset", () => {
  it("ne révèle pas si l'email existe : retourne null pour un email inconnu", async () => {
    const token = await creerTokenReset(`inconnu-${Date.now()}@test.local`);
    expect(token).toBeNull();
  });

  it("retourne un token pour un email existant et le stocke hashé (jamais en clair)", async () => {
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);

    const token = await creerTokenReset(candidat.email);

    expect(token).not.toBeNull();
    const rows = await db.passwordResetToken.findMany({ where: { userId: candidat.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).not.toBe(token); // le hash stocké diffère du token en clair
  });
});

describe("reinitialiserMotDePasse", () => {
  it("refuse un token inconnu", async () => {
    await expect(reinitialiserMotDePasse("token-qui-nexiste-pas", "nouveauMotDePasse123")).rejects.toThrow("invalide ou expiré");
  });

  it("refuse un token expiré", async () => {
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);
    const token = "token-expire-test";
    const { createHash } = await import("node:crypto");
    await db.passwordResetToken.create({
      data: {
        userId: candidat.id,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() - 60 * 1000), // expiré il y a 1 minute
      },
    });

    await expect(reinitialiserMotDePasse(token, "nouveauMotDePasse123")).rejects.toThrow("invalide ou expiré");
  });

  it("refuse un token déjà utilisé", async () => {
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);
    const userFrais = await db.user.findUniqueOrThrow({ where: { id: candidat.id } });
    const token = await creerTokenReset(userFrais.email);
    if (!token) throw new Error("setup invalide");

    await reinitialiserMotDePasse(token, "premierMotDePasse123");
    await expect(reinitialiserMotDePasse(token, "deuxiemeMotDePasse123")).rejects.toThrow("invalide ou expiré");
  });

  it("change le mot de passe, incrémente tokenVersion et invalide les autres tokens en attente", async () => {
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);
    const userAvant = await db.user.findUniqueOrThrow({ where: { id: candidat.id } });

    const tokenA = await creerTokenReset(userAvant.email);
    const tokenB = await creerTokenReset(userAvant.email); // 2e demande avant d'utiliser la 1ère
    if (!tokenA || !tokenB) throw new Error("setup invalide");

    await reinitialiserMotDePasse(tokenA, "motDePasseFinal123");

    const userApres = await db.user.findUniqueOrThrow({ where: { id: candidat.id } });
    expect(userApres.tokenVersion).toBe(userAvant.tokenVersion + 1);
    expect(await verifyPassword("motDePasseFinal123", userApres.motDePasseHash)).toBe(true);

    // Le 2e token émis avant le reset ne doit plus être utilisable.
    await expect(reinitialiserMotDePasse(tokenB, "autreMotDePasse123")).rejects.toThrow("invalide ou expiré");
  });
});
