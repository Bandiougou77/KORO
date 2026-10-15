import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import type { MoyenPaiement } from "@/generated/prisma/enums";

// Fabriques pour les tests d'intégration (contre prisma/test.db, voir vitest.config.ts).
// Chaque appel génère des identifiants uniques : pas besoin de nettoyage entre tests,
// la base de test est jetable et recréée à chaque `vitest run`.

export async function creerPaysTest() {
  return db.pays.create({
    data: {
      code: `T${randomUUID().slice(0, 8)}`,
      nom: "Pays Test",
      devise: "FCFA",
      actif: false,
      moyensPaiementDisponibles: "orange_money,wave,virement",
    },
  });
}

export async function creerEntrepriseTest(paysId: string) {
  const motDePasseHash = await hashPassword("password123");
  return db.user.create({
    data: {
      role: "entreprise",
      email: `entreprise-${randomUUID()}@test.local`,
      motDePasseHash,
      paysId,
      entreprise: { create: { nomEntreprise: "Entreprise Test", paysId } },
    },
    include: { entreprise: true },
  });
}

export async function creerCandidatTest(
  paysId: string,
  opts?: { moyenPaiementPrefere?: MoyenPaiement | null; identifiantPaiement?: string | null },
) {
  const motDePasseHash = await hashPassword("password123");
  return db.user.create({
    data: {
      role: "candidat",
      email: `candidat-${randomUUID()}@test.local`,
      motDePasseHash,
      paysId,
      profilCandidat: {
        create: {
          nom: "Test",
          prenom: "Candidat",
          disponibilite: "les_deux",
          moyenPaiementPrefere: opts?.moyenPaiementPrefere === undefined ? "orange_money" : opts.moyenPaiementPrefere,
          identifiantPaiement: opts?.identifiantPaiement === undefined ? "+223700000000" : opts.identifiantPaiement,
        },
      },
    },
    include: { profilCandidat: true },
  });
}

export async function creerMissionTest(
  entrepriseId: string,
  paysId: string,
  overrides: Partial<{
    statut: "brouillon" | "publiee" | "confirmee" | "paiement_securise" | "en_cours" | "terminee" | "payee" | "annulee" | "litige";
    montantBrut: number;
    tauxCommission: number;
    dateTerminee: Date | null;
  }> = {},
) {
  return db.mission.create({
    data: {
      entrepriseId,
      paysId,
      titre: "Mission test",
      description: "Description de test",
      mode: "distance",
      dureeType: "courte",
      typeTarif: "forfait",
      montantBrut: overrides.montantBrut ?? 1000,
      devise: "FCFA",
      tauxCommission: overrides.tauxCommission ?? 6,
      statut: overrides.statut ?? "publiee",
      dateTerminee: overrides.dateTerminee,
    },
  });
}

export async function creerAdminTest(paysId: string) {
  const motDePasseHash = await hashPassword("password123");
  return db.user.create({
    data: {
      role: "admin",
      email: `admin-${randomUUID()}@test.local`,
      motDePasseHash,
      paysId,
    },
  });
}

export async function creerCandidatureAccepteeTest(missionId: string, candidatId: string) {
  return db.candidature.create({
    data: { missionId, candidatId, statut: "acceptee" },
  });
}
