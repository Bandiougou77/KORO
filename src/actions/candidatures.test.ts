import { describe, it, expect, vi } from "vitest";
import { db } from "@/lib/db";
import { marquerMissionTerminee } from "@/actions/candidatures";
import { autoriserSequestre } from "@/lib/payment";
import { initialActionState } from "@/actions/types";
import {
  creerPaysTest,
  creerEntrepriseTest,
  creerCandidatTest,
  creerMissionTest,
  creerCandidatureAccepteeTest,
} from "@/lib/testFixtures";

let sessionSimulee: { userId: string; role: string } | null = null;

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

describe("marquerMissionTerminee (propriété et transitions)", () => {
  it("refuse un candidat qui n'est pas celui retenu sur la mission", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const candidatRetenu = await creerCandidatTest(pays.id);
    const autreCandidat = await creerCandidatTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, {});
    await creerCandidatureAccepteeTest(mission.id, candidatRetenu.id);
    await autoriserSequestre(mission.id, "orange_money");

    sessionSimulee = { userId: autreCandidat.id, role: "candidat" };
    const result = await marquerMissionTerminee(mission.id, initialActionState);

    expect(result.error).toMatch("pas le candidat retenu");
  });

  it("refuse de marquer terminée une mission qui n'est pas en paiement_securise ou en_cours", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const candidat = await creerCandidatTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "publiee" });
    await creerCandidatureAccepteeTest(mission.id, candidat.id);

    sessionSimulee = { userId: candidat.id, role: "candidat" };
    const result = await marquerMissionTerminee(mission.id, initialActionState);

    expect(result.error).toMatch("ne peut pas être marquée comme terminée");
    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("publiee");
  });

  it("autorise le candidat retenu et enregistre dateTerminee côté serveur", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const candidat = await creerCandidatTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, {});
    await creerCandidatureAccepteeTest(mission.id, candidat.id);
    await autoriserSequestre(mission.id, "orange_money");

    sessionSimulee = { userId: candidat.id, role: "candidat" };
    const avant = Date.now();
    const result = await marquerMissionTerminee(mission.id, initialActionState);

    expect(result.error).toBeUndefined();
    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("terminee");
    expect(missionMaj.dateTerminee).not.toBeNull();
    expect(missionMaj.dateTerminee!.getTime()).toBeGreaterThanOrEqual(avant);
  });
});
