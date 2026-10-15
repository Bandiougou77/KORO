import { describe, it, expect, vi } from "vitest";
import * as authLib from "@/lib/auth";
import { db } from "@/lib/db";
import { login } from "@/actions/auth";
import { initialActionState } from "@/actions/types";
import { creerPaysTest, creerCandidatTest } from "@/lib/testFixtures";

// On isole complètement le limiteur : ce fichier teste l'INTÉGRATION de login() avec le
// résultat du rate limiter, jamais un vrai Redis (Upstash) ni même le repli mémoire réel.
const limiteurMock = vi.hoisted(() => ({ verifierLimiteConnexion: vi.fn() }));
vi.mock("@/lib/rateLimiter", () => limiteurMock);
vi.mock("@/lib/clientIp", () => ({ getClientIp: async () => "203.0.113.1" }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

// createSession() (appelée après une connexion autorisée) écrit un cookie via next/headers,
// indisponible hors d'une requête Next.js réelle — même simulation que lib/auth.test.ts.
const cookieStore = new Map<string, string>();
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

function formData(email: string, password: string) {
  const fd = new FormData();
  fd.set("email", email);
  fd.set("password", password);
  return fd;
}

describe("login (intégration de la limitation des tentatives)", () => {
  it("refuse avec le message générique de limite, SANS vérifier le mot de passe", async () => {
    limiteurMock.verifierLimiteConnexion.mockResolvedValueOnce({ autorise: false, raison: "limite_depassee" });
    const spyVerify = vi.spyOn(authLib, "verifyPassword");

    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);
    const user = await db.user.findUniqueOrThrow({ where: { id: candidat.id } });

    const result = await login(initialActionState, formData(user.email, "password123"));

    expect(result.error).toBe("Trop de tentatives. Réessayez dans quelques minutes.");
    expect(spyVerify).not.toHaveBeenCalled();
    spyVerify.mockRestore();
  });

  it("renvoie un message distinct si le service de limitation est indisponible", async () => {
    limiteurMock.verifierLimiteConnexion.mockResolvedValueOnce({ autorise: false, raison: "service_indisponible" });

    const result = await login(initialActionState, formData("quiconque@test.local", "peu importe"));

    expect(result.error).toBe("Service temporairement indisponible. Réessayez dans un instant.");
  });

  it("applique le même message de limite pour un email existant ou inexistant (anti-énumération)", async () => {
    limiteurMock.verifierLimiteConnexion.mockResolvedValue({ autorise: false, raison: "limite_depassee" });

    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);
    const user = await db.user.findUniqueOrThrow({ where: { id: candidat.id } });

    const resultExistant = await login(initialActionState, formData(user.email, "peu importe"));
    const resultInexistant = await login(
      initialActionState,
      formData(`inconnu-${Date.now()}@test.local`, "peu importe"),
    );

    expect(resultExistant.error).toBe(resultInexistant.error);
  });

  it("procède normalement à la connexion quand la tentative est autorisée (contrat/redirection inchangés)", async () => {
    limiteurMock.verifierLimiteConnexion.mockResolvedValueOnce({ autorise: true });

    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);
    const user = await db.user.findUniqueOrThrow({ where: { id: candidat.id } });

    await expect(login(initialActionState, formData(user.email, "password123"))).rejects.toThrow(
      "NEXT_REDIRECT:/moncompte",
    );
  });

  it("garde le comportement normal (email/mot de passe incorrect) quand la tentative est autorisée mais les identifiants sont faux", async () => {
    limiteurMock.verifierLimiteConnexion.mockResolvedValueOnce({ autorise: true });

    const result = await login(initialActionState, formData(`personne-${Date.now()}@test.local`, "mauvaismotdepasse"));

    expect(result.error).toBe("Email ou mot de passe incorrect.");
  });
});
