import { describe, it, expect, vi } from "vitest";
import { db } from "@/lib/db";
import { ouvrirLitige, resoudreLitige, demanderInformationsLitige } from "@/actions/litiges";
import { libererParAdmin } from "@/actions/admin";
import { initialActionState } from "@/actions/types";
import {
  creerPaysTest,
  creerEntrepriseTest,
  creerCandidatTest,
  creerAdminTest,
  creerMissionTest,
  creerCandidatureAccepteeTest,
} from "@/lib/testFixtures";
import { autoriserSequestre } from "@/lib/payment";

let sessionSimulee: { userId: string; role: string; tokenVersion?: number } | null = null;

vi.mock("@/lib/auth", async (importOriginal) => {
  const reel = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...reel,
    getSession: async () => sessionSimulee,
    requireRole: async (role: string) => {
      if (!sessionSimulee) throw new Error("Vous devez être connecté.");
      if (sessionSimulee.role !== role) throw new Error("Accès non autorisé pour ce rôle.");
      return sessionSimulee;
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

function formData(motif: string, description: string) {
  const fd = new FormData();
  fd.set("motif", motif);
  fd.set("description", description);
  return fd;
}

// Mission en litige, avec paiement séquestré et candidat retenu — le point de départ commun
// à tous les tests de résolution ci-dessous.
async function creerMissionEnLitige() {
  const pays = await creerPaysTest();
  const entreprise = await creerEntrepriseTest(pays.id);
  const candidat = await creerCandidatTest(pays.id);
  const admin = await creerAdminTest(pays.id);
  const mission = await creerMissionTest(entreprise.id, pays.id, { montantBrut: 1000, tauxCommission: 5 });
  await creerCandidatureAccepteeTest(mission.id, candidat.id);
  await autoriserSequestre(mission.id, "orange_money");
  await db.mission.update({ where: { id: mission.id }, data: { statut: "terminee" } });
  const litige = await db.litige.create({
    data: { missionId: mission.id, ouvertParId: entreprise.id, motif: "non conforme", elementsFournis: "détails" },
  });
  await db.mission.update({ where: { id: mission.id }, data: { statut: "litige" } });
  return { mission, entreprise, candidat, admin, litige };
}

function resolutionFormData(decision: string, motifDecision: string, extra?: Record<string, string>) {
  const fd = new FormData();
  fd.set("decision", decision);
  fd.set("motifDecision", motifDecision);
  for (const [k, v] of Object.entries(extra ?? {})) fd.set(k, v);
  return fd;
}

describe("ouvrirLitige (contrôle de propriété et transitions)", () => {
  it("refuse si personne n'est connecté", async () => {
    sessionSimulee = null;
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "paiement_securise" });

    const result = await ouvrirLitige(mission.id, initialActionState, formData("motif", "description test"));
    expect(result.error).toMatch("connecté");
  });

  it("refuse un tiers qui n'est ni l'entreprise ni le candidat retenu", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const tiers = await creerCandidatTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "paiement_securise" });

    sessionSimulee = { userId: tiers.id, role: "candidat" };
    const result = await ouvrirLitige(mission.id, initialActionState, formData("motif", "description test"));

    expect(result.error).toMatch("partie prenante");
  });

  it("refuse d'ouvrir un litige sur une mission déjà payée", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "payee" });

    sessionSimulee = { userId: entreprise.id, role: "entreprise" };
    const result = await ouvrirLitige(mission.id, initialActionState, formData("motif", "description test"));

    expect(result.error).toMatch("ne peut plus être contestée");
  });

  it("refuse un 2e litige si un litige est déjà ouvert", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "litige" });
    await db.litige.create({ data: { missionId: mission.id, ouvertParId: entreprise.id, motif: "x", elementsFournis: "y" } });

    sessionSimulee = { userId: entreprise.id, role: "entreprise" };
    const result = await ouvrirLitige(mission.id, initialActionState, formData("motif", "description test"));

    expect(result.error).toMatch("déjà ouvert");
  });

  it("autorise l'entreprise à ouvrir un litige et gèle la mission", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "paiement_securise" });

    sessionSimulee = { userId: entreprise.id, role: "entreprise" };
    const result = await ouvrirLitige(mission.id, initialActionState, formData("paiement non reçu", "description détaillée du litige"));

    expect(result.error).toBeUndefined();
    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("litige");
    const litige = await db.litige.findUniqueOrThrow({ where: { missionId: mission.id } });
    expect(litige.ouvertParId).toBe(entreprise.id);
  });

  it("autorise le candidat retenu (pas un autre candidat) à ouvrir un litige", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const candidatRetenu = await creerCandidatTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "terminee" });
    await creerCandidatureAccepteeTest(mission.id, candidatRetenu.id);

    sessionSimulee = { userId: candidatRetenu.id, role: "candidat" };
    const result = await ouvrirLitige(mission.id, initialActionState, formData("mission non terminée", "description détaillée"));

    expect(result.error).toBeUndefined();
    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("litige");
  });
});

describe("demanderInformationsLitige (admin uniquement)", () => {
  it("refuse un appel non-admin", async () => {
    const { litige } = await creerMissionEnLitige();
    sessionSimulee = { userId: "quelconque", role: "entreprise" };

    const fd = new FormData();
    fd.set("message", "Pouvez-vous préciser ?");
    await expect(demanderInformationsLitige(litige.id, initialActionState, fd)).rejects.toThrow("Accès non autorisé");
  });

  it("passe le litige en 'informations_demandees' et poste un message interne traçable", async () => {
    const { litige, mission, admin } = await creerMissionEnLitige();
    sessionSimulee = { userId: admin.id, role: "admin" };

    const fd = new FormData();
    fd.set("message", "Merci de fournir une preuve de livraison.");
    const result = await demanderInformationsLitige(litige.id, initialActionState, fd);

    expect(result.error).toBeUndefined();
    const litigeMaj = await db.litige.findUniqueOrThrow({ where: { id: litige.id } });
    expect(litigeMaj.statut).toBe("informations_demandees");

    const message = await db.messageInterne.findFirstOrThrow({ where: { missionId: mission.id, expediteurId: admin.id } });
    expect(message.contenu).toMatch("preuve de livraison");
  });

  it("refuse si le litige est déjà résolu", async () => {
    const { litige, admin } = await creerMissionEnLitige();
    await db.litige.update({ where: { id: litige.id }, data: { statut: "resolu" } });
    sessionSimulee = { userId: admin.id, role: "admin" };

    const fd = new FormData();
    fd.set("message", "Trop tard");
    const result = await demanderInformationsLitige(litige.id, initialActionState, fd);
    expect(result.error).toMatch("déjà résolu");
  });
});

describe("resoudreLitige (admin uniquement) — traçabilité et conséquences financières", () => {
  it("refuse un appel non-admin", async () => {
    const { litige } = await creerMissionEnLitige();
    sessionSimulee = { userId: "quelconque", role: "candidat" };

    const result_promise = resoudreLitige(litige.id, initialActionState, resolutionFormData("paiement_candidat", "motif"));
    await expect(result_promise).rejects.toThrow("Accès non autorisé");
  });

  it("décision 'paiement_candidat' : libère le séquestre et historise la décision (motif, admin, horodatage)", async () => {
    const { litige, mission, candidat, admin } = await creerMissionEnLitige();
    sessionSimulee = { userId: admin.id, role: "admin" };

    const result = await resoudreLitige(litige.id, initialActionState, resolutionFormData("paiement_candidat", "Travail livré conforme"));

    expect(result.error).toBeUndefined();
    const litigeMaj = await db.litige.findUniqueOrThrow({ where: { id: litige.id } });
    expect(litigeMaj.statut).toBe("resolu");
    expect(litigeMaj.decision).toBe("paiement_candidat");
    expect(litigeMaj.motifDecision).toBe("Travail livré conforme");
    expect(litigeMaj.resoluParId).toBe(admin.id);
    expect(litigeMaj.dateResolution).not.toBeNull();

    const paiement = await db.paiement.findUniqueOrThrow({ where: { missionId: mission.id } });
    expect(paiement.statut).toBe("effectue");
    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("payee");
    const solde = await db.solde.findUniqueOrThrow({ where: { candidatId: candidat.id } });
    expect(solde.montantDisponible).toBe(paiement.montantNetCandidat);
  });

  it("décision 'remboursement_entreprise' : marque le paiement 'rembourse' — jamais un vrai virement, juste l'état simulé", async () => {
    const { litige, mission, admin } = await creerMissionEnLitige();
    sessionSimulee = { userId: admin.id, role: "admin" };

    const result = await resoudreLitige(litige.id, initialActionState, resolutionFormData("remboursement_entreprise", "Mission non réalisée"));

    expect(result.error).toBeUndefined();
    const paiement = await db.paiement.findUniqueOrThrow({ where: { missionId: mission.id } });
    expect(paiement.statut).toBe("rembourse");
    // Les montants d'origine ne sont jamais réécrits : seul le statut change.
    expect(paiement.montantBrut).toBe(mission.montantBrut);
    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("remboursee");
    const litigeMaj = await db.litige.findUniqueOrThrow({ where: { id: litige.id } });
    expect(litigeMaj.montantRembourseEntreprise).toBe(0);
  });

  it("décision 'partage' : rembourse l'entreprise ET crédite la part convenue au prestataire", async () => {
    const { litige, mission, candidat, admin } = await creerMissionEnLitige();
    sessionSimulee = { userId: admin.id, role: "admin" };

    const result = await resoudreLitige(
      litige.id,
      initialActionState,
      resolutionFormData("partage", "Travail partiellement livré", { montantVersePrestataire: "300" }),
    );

    expect(result.error).toBeUndefined();
    const paiement = await db.paiement.findUniqueOrThrow({ where: { missionId: mission.id } });
    expect(paiement.statut).toBe("rembourse");
    const solde = await db.solde.findUniqueOrThrow({ where: { candidatId: candidat.id } });
    expect(solde.montantDisponible).toBe(300);
    const litigeMaj = await db.litige.findUniqueOrThrow({ where: { id: litige.id } });
    expect(litigeMaj.montantVersePrestataire).toBe(300);
  });

  it("décision 'compte_suspendu' : suspend le compte ciblé, sans mouvement financier", async () => {
    const { litige, mission, entreprise, admin } = await creerMissionEnLitige();
    sessionSimulee = { userId: admin.id, role: "admin" };

    const result = await resoudreLitige(
      litige.id,
      initialActionState,
      resolutionFormData("compte_suspendu", "Comportement abusif avéré", { utilisateurASuspendre: entreprise.id }),
    );

    expect(result.error).toBeUndefined();
    const entrepriseMaj = await db.user.findUniqueOrThrow({ where: { id: entreprise.id } });
    expect(entrepriseMaj.compteSuspendu).toBe(true);
    const paiement = await db.paiement.findUniqueOrThrow({ where: { missionId: mission.id } });
    expect(paiement.statut).toBe("retenu_en_sequestre");
    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("terminee");
  });

  it("empêche de trancher deux fois le même litige (deux admins / double-clic concurrents)", async () => {
    const { litige, admin } = await creerMissionEnLitige();
    sessionSimulee = { userId: admin.id, role: "admin" };

    const resultats = await Promise.allSettled([
      resoudreLitige(litige.id, initialActionState, resolutionFormData("paiement_candidat", "Décision A")),
      resoudreLitige(litige.id, initialActionState, resolutionFormData("remboursement_entreprise", "Décision B")),
    ]);

    const reussis = resultats.filter(
      (r) => r.status === "fulfilled" && (r.value as { error?: string }).error === undefined,
    );
    const refuses = resultats.filter(
      (r) => r.status === "fulfilled" && (r.value as { error?: string }).error !== undefined,
    );
    expect(reussis).toHaveLength(1);
    expect(refuses).toHaveLength(1);

    const litigeMaj = await db.litige.findUniqueOrThrow({ where: { id: litige.id } });
    // Une seule décision doit avoir gagné — jamais un mélange des deux.
    expect(["paiement_candidat", "remboursement_entreprise"]).toContain(litigeMaj.decision);
  });

  it("refuse de re-résoudre un litige déjà résolu (appel répété)", async () => {
    const { litige, admin } = await creerMissionEnLitige();
    sessionSimulee = { userId: admin.id, role: "admin" };

    await resoudreLitige(litige.id, initialActionState, resolutionFormData("paiement_candidat", "Première décision"));
    const second = await resoudreLitige(litige.id, initialActionState, resolutionFormData("remboursement_entreprise", "Seconde tentative"));

    expect(second.error).toMatch("déjà été résolu");
  });
});

describe("libererParAdmin bloqué par un litige non résolu (actions/admin.ts)", () => {
  it("refuse de libérer un paiement tant que le litige n'est pas résolu", async () => {
    const { mission, admin } = await creerMissionEnLitige();
    sessionSimulee = { userId: admin.id, role: "admin" };

    const result = await libererParAdmin(mission.id, initialActionState);

    expect(result.error).toMatch("litige est ouvert");
    const paiement = await db.paiement.findUniqueOrThrow({ where: { missionId: mission.id } });
    expect(paiement.statut).toBe("retenu_en_sequestre");
  });

  it("autorise la libération une fois le litige résolu en faveur du prestataire", async () => {
    const { mission, litige, candidat, admin } = await creerMissionEnLitige();
    sessionSimulee = { userId: admin.id, role: "admin" };

    // Le litige a déjà été résolu via resoudreLitige, qui a lui-même libéré le séquestre ;
    // on vérifie ici que libererParAdmin ne re-tente pas une seconde libération en double.
    await resoudreLitige(litige.id, initialActionState, resolutionFormData("paiement_candidat", "Conforme"));
    const result = await libererParAdmin(mission.id, initialActionState);

    expect(result.error).toMatch("Aucun paiement séquestré");
    const solde = await db.solde.findUniqueOrThrow({ where: { candidatId: candidat.id } });
    expect(solde.montantDisponible).toBeGreaterThan(0);
  });
});
