import { describe, it, expect, vi } from "vitest";
import { db } from "@/lib/db";
import { libererParAdmin } from "@/actions/admin";
import { initialActionState } from "@/actions/types";
import {
  creerPaysTest,
  creerEntrepriseTest,
  creerCandidatTest,
  creerMissionTest,
  creerCandidatureAccepteeTest,
} from "@/lib/testFixtures";
import { autoriserSequestre } from "@/lib/payment";

let sessionSimulee: { userId: string; role: string; tokenVersion: number } | null = null;

vi.mock("@/lib/auth", async (importOriginal) => {
  const reel = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...reel,
    requireRole: async (role: string) => {
      if (!sessionSimulee) throw new Error("Vous devez être connecté.");
      if (sessionSimulee.role !== role) throw new Error("Accès non autorisé pour ce rôle.");
      return sessionSimulee;
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

describe("libererParAdmin (contrôle d'accès admin)", () => {
  it("refuse un appel non-admin (requireRole lève, cohérent avec les autres actions admin-only)", async () => {
    sessionSimulee = { userId: "quelconque", role: "entreprise", tokenVersion: 0 };
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "terminee" });

    await expect(libererParAdmin(mission.id, initialActionState)).rejects.toThrow("Accès non autorisé");
  });

  it("autorise un admin à libérer une mission en attente", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const candidat = await creerCandidatTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, {});
    await creerCandidatureAccepteeTest(mission.id, candidat.id);
    await autoriserSequestre(mission.id, "orange_money");
    // Simule la déclaration de livraison par le prestataire, requise avant la libération admin.
    await db.mission.update({ where: { id: mission.id }, data: { statut: "terminee" } });

    sessionSimulee = { userId: "admin-1", role: "admin", tokenVersion: 0 };
    const result = await libererParAdmin(mission.id, initialActionState);

    expect(result.error).toBeUndefined();
    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("payee");
  });
});
