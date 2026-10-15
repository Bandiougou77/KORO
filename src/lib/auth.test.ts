import { describe, it, expect, vi } from "vitest";
import { db } from "@/lib/db";
import { createSession, requireRole, AuthError } from "@/lib/auth";
import { creerPaysTest, creerCandidatTest, creerEntrepriseTest } from "@/lib/testFixtures";

// requireRole()/getSession() lisent le cookie de session via next/headers, indisponible hors
// d'une requête Next.js réelle. On simule un magasin de cookies en mémoire que createSession
// (code réel, non modifié) remplit via cookieStore.set(...).
let cookieStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieStore.has(name) ? { value: cookieStore.get(name) } : undefined),
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  }),
}));

describe("requireRole", () => {
  it("lève une erreur si personne n'est connecté", async () => {
    cookieStore = new Map();
    await expect(requireRole("candidat")).rejects.toThrow(AuthError);
  });

  it("lève une erreur si le rôle ne correspond pas", async () => {
    cookieStore = new Map();
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);
    await createSession(candidat.id, "candidat", candidat.tokenVersion);

    await expect(requireRole("entreprise")).rejects.toThrow("Accès non autorisé pour ce rôle.");
  });

  it("réussit quand la session et le rôle correspondent", async () => {
    cookieStore = new Map();
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    await createSession(entreprise.id, "entreprise", entreprise.tokenVersion);

    const session = await requireRole("entreprise");
    expect(session.userId).toBe(entreprise.id);
    expect(session.role).toBe("entreprise");
  });

  it("révoque une session dont le tokenVersion ne correspond plus (ex: après reset de mot de passe)", async () => {
    cookieStore = new Map();
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);
    await createSession(candidat.id, "candidat", candidat.tokenVersion);

    // Simule un reset de mot de passe survenu après l'émission du cookie.
    await db.user.update({ where: { id: candidat.id }, data: { tokenVersion: { increment: 1 } } });

    await expect(requireRole("candidat")).rejects.toThrow("Votre session a expiré");
  });

  it("bloque un compte suspendu même avec une session valide", async () => {
    cookieStore = new Map();
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);
    await createSession(candidat.id, "candidat", candidat.tokenVersion);

    await db.user.update({ where: { id: candidat.id }, data: { compteSuspendu: true } });

    await expect(requireRole("candidat")).rejects.toThrow("suspendu");
  });
});
