import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { autoriserSequestre, libererSequestre, missionsEnAttenteValidationAdmin, DELAI_VALIDATION_MS } from "@/lib/payment";
import { creerPaysTest, creerEntrepriseTest, creerCandidatTest, creerMissionTest, creerCandidatureAccepteeTest } from "@/lib/testFixtures";

describe("autoriserSequestre", () => {
  it("crée un paiement en séquestre et passe la mission à paiement_securise", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { montantBrut: 1000, tauxCommission: 6 });

    await autoriserSequestre(mission.id, "orange_money");

    const paiement = await db.paiement.findUniqueOrThrow({ where: { missionId: mission.id } });
    expect(paiement.statut).toBe("retenu_en_sequestre");
    expect(paiement.commission).toBe(60);

    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("paiement_securise");
  });
});

describe("libererSequestre", () => {
  async function setupMissionPayee() {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const candidat = await creerCandidatTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { montantBrut: 1000, tauxCommission: 6 });
    await creerCandidatureAccepteeTest(mission.id, candidat.id);
    await autoriserSequestre(mission.id, "orange_money");
    // Simule la déclaration de livraison par le prestataire (candidatures.ts::marquerMissionTerminee) —
    // nécessaire pour que libererSequestre (terminee -> payee) respecte la transition autorisée.
    await db.mission.update({ where: { id: mission.id }, data: { statut: "terminee" } });
    return { mission, candidat };
  }

  it("libère le paiement, passe la mission à payee et crédite le solde du candidat", async () => {
    const { mission, candidat } = await setupMissionPayee();

    await libererSequestre(mission.id);

    const paiement = await db.paiement.findUniqueOrThrow({ where: { missionId: mission.id } });
    expect(paiement.statut).toBe("effectue");

    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("payee");

    const solde = await db.solde.findUniqueOrThrow({ where: { candidatId: candidat.id } });
    expect(solde.montantDisponible).toBe(paiement.montantNetCandidat);
  });

  it("refuse de libérer une mission sans paiement", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "terminee" });

    await expect(libererSequestre(mission.id)).rejects.toThrow("Aucun paiement séquestré");
  });

  it("refuse de libérer deux fois le même paiement (appel séquentiel)", async () => {
    const { mission } = await setupMissionPayee();

    await libererSequestre(mission.id);
    await expect(libererSequestre(mission.id)).rejects.toThrow("Aucun paiement séquestré");
  });

  it("empêche le double crédit lors de deux appels concurrents (régression de la race condition corrigée)", async () => {
    const { mission, candidat } = await setupMissionPayee();

    const paiementAvant = await db.paiement.findUniqueOrThrow({ where: { missionId: mission.id } });

    const resultats = await Promise.allSettled([libererSequestre(mission.id), libererSequestre(mission.id)]);

    const reussis = resultats.filter((r) => r.status === "fulfilled");
    const echoues = resultats.filter((r) => r.status === "rejected");
    expect(reussis).toHaveLength(1);
    expect(echoues).toHaveLength(1);

    const solde = await db.solde.findUniqueOrThrow({ where: { candidatId: candidat.id } });
    expect(solde.montantDisponible).toBe(paiementAvant.montantNetCandidat);
  });
});

describe("missionsEnAttenteValidationAdmin", () => {
  it("liste une mission terminée depuis plus de 3 jours sans litige, SANS la libérer (plus de libération automatique)", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const candidat = await creerCandidatTest(pays.id);
    const il_y_a_4_jours = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const mission = await creerMissionTest(entreprise.id, pays.id, { dateTerminee: il_y_a_4_jours });
    await creerCandidatureAccepteeTest(mission.id, candidat.id);
    await autoriserSequestre(mission.id, "orange_money");
    await db.mission.update({ where: { id: mission.id }, data: { statut: "terminee" } });

    const enAttente = await missionsEnAttenteValidationAdmin();

    expect(enAttente.some((m) => m.id === mission.id)).toBe(true);
    // Le point central du changement : aucune libération automatique ne doit avoir eu lieu.
    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("terminee");
    const paiement = await db.paiement.findUniqueOrThrow({ where: { missionId: mission.id } });
    expect(paiement.statut).toBe("retenu_en_sequestre");
  });

  it("ne liste PAS une mission terminée depuis moins de 3 jours", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const candidat = await creerCandidatTest(pays.id);
    const il_y_a_1_jour = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const mission = await creerMissionTest(entreprise.id, pays.id, { dateTerminee: il_y_a_1_jour });
    await creerCandidatureAccepteeTest(mission.id, candidat.id);
    await autoriserSequestre(mission.id, "orange_money");
    await db.mission.update({ where: { id: mission.id }, data: { statut: "terminee" } });

    const enAttente = await missionsEnAttenteValidationAdmin();

    expect(enAttente.some((m) => m.id === mission.id)).toBe(false);
  });

  it("ne liste PAS une mission en litige, même si le délai de 3 jours est dépassé", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const candidat = await creerCandidatTest(pays.id);
    const il_y_a_4_jours = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const mission = await creerMissionTest(entreprise.id, pays.id, { dateTerminee: il_y_a_4_jours });
    await creerCandidatureAccepteeTest(mission.id, candidat.id);
    await autoriserSequestre(mission.id, "orange_money");
    // Le gel d'un litige passe par mission.statut = "litige" (voir actions/litiges.ts),
    // ce qui exclut la mission de la requête `where: { statut: "terminee", ... }`.
    await db.mission.update({ where: { id: mission.id }, data: { statut: "litige" } });
    await db.litige.create({ data: { missionId: mission.id, ouvertParId: candidat.id, motif: "test", elementsFournis: "test" } });

    const enAttente = await missionsEnAttenteValidationAdmin();

    expect(enAttente.some((m) => m.id === mission.id)).toBe(false);
  });

  it("frontière exacte : une minute après les 3 jours, la mission est listée", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const candidat = await creerCandidatTest(pays.id);
    const juste_apres_delai = new Date(Date.now() - (DELAI_VALIDATION_MS + 60_000));
    const mission = await creerMissionTest(entreprise.id, pays.id, { dateTerminee: juste_apres_delai });
    await creerCandidatureAccepteeTest(mission.id, candidat.id);
    await autoriserSequestre(mission.id, "orange_money");
    await db.mission.update({ where: { id: mission.id }, data: { statut: "terminee" } });

    const enAttente = await missionsEnAttenteValidationAdmin();

    expect(enAttente.some((m) => m.id === mission.id)).toBe(true);
  });

  it("frontière exacte : une minute avant les 3 jours, la mission n'est PAS encore listée", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const candidat = await creerCandidatTest(pays.id);
    const juste_avant_delai = new Date(Date.now() - (DELAI_VALIDATION_MS - 60_000));
    const mission = await creerMissionTest(entreprise.id, pays.id, { dateTerminee: juste_avant_delai });
    await creerCandidatureAccepteeTest(mission.id, candidat.id);
    await autoriserSequestre(mission.id, "orange_money");
    await db.mission.update({ where: { id: mission.id }, data: { statut: "terminee" } });

    const enAttente = await missionsEnAttenteValidationAdmin();

    expect(enAttente.some((m) => m.id === mission.id)).toBe(false);
  });
});
