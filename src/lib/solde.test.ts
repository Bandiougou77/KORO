import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { crediterSolde, effectuerRetrait } from "@/lib/solde";
import { creerPaysTest, creerCandidatTest, creerEntrepriseTest, creerMissionTest } from "@/lib/testFixtures";

// crediterSolde exige un missionId réel (contrainte de clé étrangère sur MouvementSolde) —
// cette fabrique crée une mission jetable juste pour satisfaire la contrainte.
async function crediterSoldeTest(paysId: string, candidatId: string, montant: number) {
  const entreprise = await creerEntrepriseTest(paysId);
  const mission = await creerMissionTest(entreprise.id, paysId);
  await crediterSolde(candidatId, montant, "FCFA", mission.id);
}

describe("crediterSolde", () => {
  it("crée le solde au premier crédit, puis l'incrémente ensuite", async () => {
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);

    await crediterSoldeTest(pays.id, candidat.id, 100);
    let solde = await db.solde.findUniqueOrThrow({ where: { candidatId: candidat.id } });
    expect(solde.montantDisponible).toBe(100);

    await crediterSoldeTest(pays.id, candidat.id, 50);
    solde = await db.solde.findUniqueOrThrow({ where: { candidatId: candidat.id } });
    expect(solde.montantDisponible).toBe(150);
  });
});

describe("effectuerRetrait", () => {
  it("effectue un retrait normal : décrémente le solde et enregistre le mouvement", async () => {
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id, { moyenPaiementPrefere: "wave", identifiantPaiement: "+223611111111" });
    await crediterSoldeTest(pays.id, candidat.id, 200);

    const retrait = await effectuerRetrait(candidat.id, 80);

    expect(retrait.moyenRetrait).toBe("wave");
    expect(retrait.identifiantDestinataire).toBe("+223611111111");
    expect(retrait.statut).toBe("recu");

    const solde = await db.solde.findUniqueOrThrow({ where: { candidatId: candidat.id } });
    expect(solde.montantDisponible).toBe(120);

    const mouvement = await db.mouvementSolde.findFirstOrThrow({ where: { retraitId: retrait.id } });
    expect(mouvement.type).toBe("debit_retrait");
    expect(mouvement.montant).toBe(80);
  });

  it("refuse un retrait supérieur au solde disponible, sans toucher au solde ni créer d'écriture", async () => {
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);
    await crediterSoldeTest(pays.id, candidat.id, 100);

    await expect(effectuerRetrait(candidat.id, 150)).rejects.toThrow("Solde insuffisant");

    const solde = await db.solde.findUniqueOrThrow({ where: { candidatId: candidat.id } });
    expect(solde.montantDisponible).toBe(100);
    const retraits = await db.retrait.findMany({ where: { candidatId: candidat.id } });
    expect(retraits).toHaveLength(0);
  });

  it.each([0, -1, -0.01, NaN, Infinity])("refuse un montant invalide (%s)", async (montantInvalide) => {
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);
    await crediterSoldeTest(pays.id, candidat.id, 100);

    await expect(effectuerRetrait(candidat.id, montantInvalide)).rejects.toThrow("Montant de retrait invalide");

    const solde = await db.solde.findUniqueOrThrow({ where: { candidatId: candidat.id } });
    expect(solde.montantDisponible).toBe(100);
  });

  it("refuse un retrait si le profil n'a pas de moyen de paiement déclaré, ET restaure le solde réservé (échec intermédiaire)", async () => {
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id, { moyenPaiementPrefere: null, identifiantPaiement: null });
    await crediterSoldeTest(pays.id, candidat.id, 100);

    // Le solde est réservé par la transaction AVANT que le profil ne soit vérifié (voir
    // l'ordre dans lib/solde.ts) : ce test vérifie que l'échec de cette étape ultérieure fait
    // bien annuler (rollback) la réservation déjà faite, pas seulement qu'il lève une erreur.
    await expect(effectuerRetrait(candidat.id, 50)).rejects.toThrow("Complétez votre moyen de paiement");

    const solde = await db.solde.findUniqueOrThrow({ where: { candidatId: candidat.id } });
    expect(solde.montantDisponible).toBe(100);
    const retraits = await db.retrait.findMany({ where: { candidatId: candidat.id } });
    expect(retraits).toHaveLength(0);
  });

  it("effectue le retrait vers la destination déclarée au profil, jamais une destination arbitraire", async () => {
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id, { moyenPaiementPrefere: "wave", identifiantPaiement: "+223611111111" });
    await crediterSoldeTest(pays.id, candidat.id, 200);

    const retrait = await effectuerRetrait(candidat.id, 80);

    expect(retrait.moyenRetrait).toBe("wave");
    expect(retrait.identifiantDestinataire).toBe("+223611111111");
  });

  it("empêche deux retraits concurrents de dépasser le solde disponible (régression de la race condition corrigée)", async () => {
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);
    await crediterSoldeTest(pays.id, candidat.id, 100);

    // Deux retraits de 80 chacun (160 au total) contre un solde de 100 : au plus un seul peut
    // réussir. Avant le correctif, la vérification non-atomique laissait les deux passer.
    const resultats = await Promise.allSettled([effectuerRetrait(candidat.id, 80), effectuerRetrait(candidat.id, 80)]);
    const reussis = resultats.filter((r) => r.status === "fulfilled");
    const echoues = resultats.filter((r) => r.status === "rejected");

    expect(reussis).toHaveLength(1);
    expect(echoues).toHaveLength(1);

    const solde = await db.solde.findUniqueOrThrow({ where: { candidatId: candidat.id } });
    expect(solde.montantDisponible).toBe(20); // 100 - 80, jamais négatif

    const retraits = await db.retrait.findMany({ where: { candidatId: candidat.id } });
    expect(retraits).toHaveLength(1);
    const mouvements = await db.mouvementSolde.findMany({ where: { soldeId: candidat.id, type: "debit_retrait" } });
    expect(mouvements).toHaveLength(1);
  });

  it("empêche trois retraits concurrents de 40 contre un solde de 100 de dépasser 2 réussites", async () => {
    const pays = await creerPaysTest();
    const candidat = await creerCandidatTest(pays.id);
    await crediterSoldeTest(pays.id, candidat.id, 100);

    const resultats = await Promise.allSettled([
      effectuerRetrait(candidat.id, 40),
      effectuerRetrait(candidat.id, 40),
      effectuerRetrait(candidat.id, 40),
    ]);
    const reussis = resultats.filter((r) => r.status === "fulfilled");

    // 100 / 40 = 2,5 → au plus 2 retraits de 40 peuvent réussir (80 au total), jamais 3 (120).
    expect(reussis.length).toBeLessThanOrEqual(2);

    const solde = await db.solde.findUniqueOrThrow({ where: { candidatId: candidat.id } });
    expect(solde.montantDisponible).toBe(100 - reussis.length * 40);
    expect(solde.montantDisponible).toBeGreaterThanOrEqual(0);
  });
});
