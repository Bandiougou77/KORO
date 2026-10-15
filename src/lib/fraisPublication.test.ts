import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import {
  getFraisPublicationActif,
  creerFraisPublicationPourMission,
  rafraichirFraisPublicationSiChange,
  confirmerPublication,
} from "@/lib/fraisPublication";
import { creerPaysTest, creerEntrepriseTest, creerMissionTest } from "@/lib/testFixtures";

async function activerFrais(paysId: string, montant: number) {
  await db.configFraisPublication.create({
    data: { paysId, actif: true, montant, devise: "FCFA" },
  });
}

describe("getFraisPublicationActif", () => {
  it("retourne inactif/0 quand aucune configuration n'existe (gratuit par défaut)", async () => {
    const pays = await creerPaysTest();
    const result = await getFraisPublicationActif(pays.id);
    expect(result).toEqual({ actif: false, montant: 0, devise: null });
  });

  it("retourne la configuration active la plus récente", async () => {
    const pays = await creerPaysTest();
    await activerFrais(pays.id, 500);
    const result = await getFraisPublicationActif(pays.id);
    expect(result.actif).toBe(true);
    expect(result.montant).toBe(500);
  });
});

describe("creerFraisPublicationPourMission + confirmerPublication", () => {
  it("publication gratuite avec frais désactivés : publie directement, aucune transaction de frais due", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "brouillon" });

    const frais = await creerFraisPublicationPourMission(mission.id, pays.id, "FCFA");
    expect(frais.statut).toBe("gratuit");
    expect(frais.montant).toBe(0);

    await confirmerPublication(mission.id, pays.id);

    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("publiee");
  });

  it("publication avec frais activés : reste en brouillon tant que non payé, publie une fois payé", async () => {
    const pays = await creerPaysTest();
    await activerFrais(pays.id, 1000);
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "brouillon" });

    const frais = await creerFraisPublicationPourMission(mission.id, pays.id, "FCFA");
    expect(frais.statut).toBe("en_attente");
    expect(frais.montant).toBe(1000);

    await confirmerPublication(mission.id, pays.id);

    const fraisMaj = await db.fraisPublication.findUniqueOrThrow({ where: { missionId: mission.id } });
    expect(fraisMaj.statut).toBe("paye");
    expect(fraisMaj.datePaiement).not.toBeNull();
    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("publiee");
  });

  it("commission et frais de publication sont des lignes de transaction séparées, jamais mélangées", async () => {
    const pays = await creerPaysTest();
    await activerFrais(pays.id, 1000);
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "brouillon", montantBrut: 50000, tauxCommission: 5 });
    await creerFraisPublicationPourMission(mission.id, pays.id, "FCFA");
    await confirmerPublication(mission.id, pays.id);

    // Aucun Paiement (commission) ne doit exister à ce stade — seule la mission est publiée,
    // le séquestre/commission n'intervient qu'à l'acceptation d'une candidature (autre flux).
    const paiement = await db.paiement.findUnique({ where: { missionId: mission.id } });
    expect(paiement).toBeNull();
    const frais = await db.fraisPublication.findUniqueOrThrow({ where: { missionId: mission.id } });
    expect(frais.montant).toBe(1000); // indépendant de montantBrut (50000) et de la commission
  });

  it("prix modifié entre l'affichage et la confirmation : signale le changement, ne publie pas, ne débite pas l'ancien prix", async () => {
    const pays = await creerPaysTest();
    await activerFrais(pays.id, 1000);
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "brouillon" });
    await creerFraisPublicationPourMission(mission.id, pays.id, "FCFA");

    // L'admin change le prix après que l'entrepreneur a vu l'écran de confirmation.
    await activerFrais(pays.id, 2000);

    await expect(confirmerPublication(mission.id, pays.id)).rejects.toThrow("prix de publication a changé");

    const fraisMaj = await db.fraisPublication.findUniqueOrThrow({ where: { missionId: mission.id } });
    expect(fraisMaj.montant).toBe(2000); // resynchronisé sur le nouveau prix
    expect(fraisMaj.statut).toBe("en_attente"); // toujours pas payé
    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("brouillon"); // pas publiée tant que non reconfirmée

    // Reconfirmer avec le nouveau prix synchronisé fonctionne normalement.
    await confirmerPublication(mission.id, pays.id);
    const missionFinale = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionFinale.statut).toBe("publiee");
  });

  it("rafraichirFraisPublicationSiChange ne retouche plus rien une fois payé", async () => {
    const pays = await creerPaysTest();
    await activerFrais(pays.id, 1000);
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "brouillon" });
    await creerFraisPublicationPourMission(mission.id, pays.id, "FCFA");
    await confirmerPublication(mission.id, pays.id);

    await activerFrais(pays.id, 9999); // changement de prix après coup, sans effet rétroactif

    const { aChange } = await rafraichirFraisPublicationSiChange(mission.id, pays.id);
    expect(aChange).toBe(false);
    const frais = await db.fraisPublication.findUniqueOrThrow({ where: { missionId: mission.id } });
    expect(frais.montant).toBe(1000); // jamais rétroactif sur un prix déjà payé
  });

  it("confirmation répétée / requête dupliquée : la deuxième tentative échoue proprement, pas de double publication", async () => {
    const pays = await creerPaysTest();
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "brouillon" });
    await creerFraisPublicationPourMission(mission.id, pays.id, "FCFA");

    const resultats = await Promise.allSettled([
      confirmerPublication(mission.id, pays.id),
      confirmerPublication(mission.id, pays.id),
    ]);

    const reussis = resultats.filter((r) => r.status === "fulfilled");
    expect(reussis).toHaveLength(1);
    const missionMaj = await db.mission.findUniqueOrThrow({ where: { id: mission.id } });
    expect(missionMaj.statut).toBe("publiee");
  });

  it("confirmation répétée avec frais payants : le deuxième paiement échoue, pas de double débit", async () => {
    const pays = await creerPaysTest();
    await activerFrais(pays.id, 1000);
    const entreprise = await creerEntrepriseTest(pays.id);
    const mission = await creerMissionTest(entreprise.id, pays.id, { statut: "brouillon" });
    await creerFraisPublicationPourMission(mission.id, pays.id, "FCFA");

    await confirmerPublication(mission.id, pays.id);
    await expect(confirmerPublication(mission.id, pays.id)).rejects.toThrow("déjà été traité");

    const mouvements = await db.fraisPublication.findMany({ where: { missionId: mission.id } });
    expect(mouvements).toHaveLength(1); // une seule ligne de transaction, pas de double débit
  });
});
