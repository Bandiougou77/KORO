import { describe, it, expect, vi } from "vitest";
import { db } from "@/lib/db";
import { cancelMission, confirmerPublicationMission } from "@/actions/missions";
import { creerFraisPublicationPourMission } from "@/lib/fraisPublication";
import { creerPaysTest, creerEntrepriseTest, creerMissionTest } from "@/lib/testFixtures";
import { initialActionState } from "@/actions/types";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

// requireRole() est déjà testé en profondeur dans lib/auth.test.ts (rôle, tokenVersion,
// suspension). Ici on veut isoler la logique de PROPRIÉTÉ de la Server Action elle-même
// (une entreprise ne doit pouvoir annuler que ses propres missions) sans reconstruire un
// vrai cookie de session — on simule juste requireRole() pour contrôler qui est "connecté".
let sessionSimulee: { userId: string; role: string; tokenVersion: number } | null = null;

// On ne remplace QUE requireRole — hashPassword/verifyPassword/etc. restent les vraies
// implémentations, nécessaires à testFixtures.ts (créer un candidat hashe un mot de passe).
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

describe("cancelMission (contrôle de propriété)", () => {
  it("refuse d'annuler la mission d'une AUTRE entreprise", async () => {
    const pays = await creerPaysTest();
    const proprietaire = await creerEntrepriseTest(pays.id);
    const autre = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(proprietaire.id, pays.id, { statut: "publiee" });

    sessionSimulee = { userId: autre.id, role: "entreprise", tokenVersion: 0 };
    const result = await cancelMission(mission.id, initialActionState);

    expect(result.error).toMatch("Vous ne pouvez pas annuler");
    const missionInchangee = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionInchangee.statut).toBe("publiee");
  });

  it("refuse d'annuler une mission déjà payée", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "payee" });

    sessionSimulee = { userId: entreprise.id, role: "entreprise", tokenVersion: 0 };
    const result = await cancelMission(mission.id, initialActionState);

    expect(result.error).toMatch("ne peut plus être annulée");
  });

  it("autorise le propriétaire à annuler sa propre mission publiée", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "publiee" });

    sessionSimulee = { userId: entreprise.id, role: "entreprise", tokenVersion: 0 };
    const result = await cancelMission(mission.id, initialActionState);

    expect(result.error).toBeUndefined();
    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("annulee");
  });
});

describe("confirmerPublicationMission (contrôle d'accès et publication)", () => {
  it("refuse de publier la mission d'une AUTRE entreprise", async () => {
    const pays = await creerPaysTest();
    const proprietaire = await creerEntrepriseTest(pays.id);
    const autre = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(proprietaire.id, pays.id, { statut: "brouillon" });
    await creerFraisPublicationPourMission(mission.id, pays.id, "FCFA");

    sessionSimulee = { userId: autre.id, role: "entreprise", tokenVersion: 0 };
    const result = await confirmerPublicationMission(mission.id, initialActionState);

    expect(result.error).toMatch("Vous ne pouvez pas publier");
    const missionInchangee = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionInchangee.statut).toBe("brouillon");
  });

  it("refuse si la mission n'est plus en brouillon (déjà publiée)", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "publiee" });

    sessionSimulee = { userId: entreprise.id, role: "entreprise", tokenVersion: 0 };
    const result = await confirmerPublicationMission(mission.id, initialActionState);

    expect(result.error).toMatch("n'est plus en attente de publication");
  });

  it("publie la mission du propriétaire (gratuit) et redirige vers la fiche", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "brouillon" });
    await creerFraisPublicationPourMission(mission.id, pays.id, "FCFA");

    sessionSimulee = { userId: entreprise.id, role: "entreprise", tokenVersion: 0 };
    await expect(confirmerPublicationMission(mission.id, initialActionState)).rejects.toThrow(
      `NEXT_REDIRECT:/offres/${mission.id}`,
    );

    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("publiee");
  });
});
