/*
  Warnings:

  - You are about to drop the column `siretOuEquivalent` on the `entreprises` table. All the data in the column will be lost.
  - You are about to drop the column `infosPaiement` on the `profils_candidats` table. All the data in the column will be lost.
  - Added the required column `paysId` to the `config_commissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paysId` to the `entreprises` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paysId` to the `missions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `devise` to the `paiements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paysId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "pays" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "devise" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT false,
    "moyensPaiementDisponibles" TEXT NOT NULL,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_config_commissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paysId" TEXT NOT NULL,
    "dureeType" TEXT NOT NULL,
    "taux" REAL NOT NULL,
    "dateEffective" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "config_commissions_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "pays" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_config_commissions" ("dateEffective", "dureeType", "id", "taux") SELECT "dateEffective", "dureeType", "id", "taux" FROM "config_commissions";
DROP TABLE "config_commissions";
ALTER TABLE "new_config_commissions" RENAME TO "config_commissions";
CREATE INDEX "config_commissions_paysId_dureeType_dateEffective_idx" ON "config_commissions"("paysId", "dureeType", "dateEffective");
CREATE TABLE "new_entreprises" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "nomEntreprise" TEXT NOT NULL,
    "identifiantLegal" TEXT,
    "adresse" TEXT,
    "paysId" TEXT NOT NULL,
    CONSTRAINT "entreprises_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "entreprises_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "pays" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_entreprises" ("adresse", "nomEntreprise", "userId") SELECT "adresse", "nomEntreprise", "userId" FROM "entreprises";
DROP TABLE "entreprises";
ALTER TABLE "new_entreprises" RENAME TO "entreprises";
CREATE TABLE "new_missions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entrepriseId" TEXT NOT NULL,
    "paysId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "lieu" TEXT,
    "dureeType" TEXT NOT NULL,
    "dateDebut" DATETIME,
    "dateFin" DATETIME,
    "typeTarif" TEXT NOT NULL,
    "montantBrut" REAL NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'EUR',
    "tauxCommission" REAL NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "missions_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprises" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "missions_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "pays" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_missions" ("dateCreation", "dateDebut", "dateFin", "description", "devise", "dureeType", "entrepriseId", "id", "lieu", "mode", "montantBrut", "statut", "tauxCommission", "titre", "typeTarif") SELECT "dateCreation", "dateDebut", "dateFin", "description", "devise", "dureeType", "entrepriseId", "id", "lieu", "mode", "montantBrut", "statut", "tauxCommission", "titre", "typeTarif" FROM "missions";
DROP TABLE "missions";
ALTER TABLE "new_missions" RENAME TO "missions";
CREATE INDEX "missions_statut_idx" ON "missions"("statut");
CREATE TABLE "new_paiements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "devise" TEXT NOT NULL,
    "moyenPaiement" TEXT,
    "montantBrut" REAL NOT NULL,
    "commission" REAL NOT NULL,
    "fraisPaiement" REAL NOT NULL,
    "montantNetCandidat" REAL NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "datePaiement" DATETIME,
    "referencePrestatairePaiement" TEXT,
    CONSTRAINT "paiements_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_paiements" ("commission", "datePaiement", "fraisPaiement", "id", "missionId", "montantBrut", "montantNetCandidat", "referencePrestatairePaiement", "statut") SELECT "commission", "datePaiement", "fraisPaiement", "id", "missionId", "montantBrut", "montantNetCandidat", "referencePrestatairePaiement", "statut" FROM "paiements";
DROP TABLE "paiements";
ALTER TABLE "new_paiements" RENAME TO "paiements";
CREATE UNIQUE INDEX "paiements_missionId_key" ON "paiements"("missionId");
CREATE TABLE "new_profils_candidats" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "competences" TEXT,
    "disponibilite" TEXT NOT NULL,
    "localisation" TEXT,
    "moyenPaiementPrefere" TEXT,
    "identifiantPaiement" TEXT,
    CONSTRAINT "profils_candidats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_profils_candidats" ("competences", "disponibilite", "localisation", "nom", "prenom", "userId") SELECT "competences", "disponibilite", "localisation", "nom", "prenom", "userId" FROM "profils_candidats";
DROP TABLE "profils_candidats";
ALTER TABLE "new_profils_candidats" RENAME TO "profils_candidats";
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "motDePasseHash" TEXT NOT NULL,
    "paysId" TEXT NOT NULL,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "pays" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_users" ("dateCreation", "email", "id", "motDePasseHash", "role", "telephone") SELECT "dateCreation", "email", "id", "motDePasseHash", "role", "telephone" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "pays_code_key" ON "pays"("code");
