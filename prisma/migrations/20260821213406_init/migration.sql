-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "motDePasseHash" TEXT NOT NULL,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "profils_candidats" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "competences" TEXT,
    "disponibilite" TEXT NOT NULL,
    "localisation" TEXT,
    "infosPaiement" TEXT,
    CONSTRAINT "profils_candidats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "entreprises" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "nomEntreprise" TEXT NOT NULL,
    "siretOuEquivalent" TEXT,
    "adresse" TEXT,
    CONSTRAINT "entreprises_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entrepriseId" TEXT NOT NULL,
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
    CONSTRAINT "missions_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprises" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "candidatures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "candidatId" TEXT NOT NULL,
    "message" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'envoyee',
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "candidatures_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "candidatures_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "profils_candidats" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "montantBrut" REAL NOT NULL,
    "commission" REAL NOT NULL,
    "fraisPaiement" REAL NOT NULL,
    "montantNetCandidat" REAL NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "datePaiement" DATETIME,
    "referencePrestatairePaiement" TEXT,
    CONSTRAINT "paiements_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "config_commissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dureeType" TEXT NOT NULL,
    "taux" REAL NOT NULL,
    "dateEffective" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "missions_statut_idx" ON "missions"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "candidatures_missionId_candidatId_key" ON "candidatures"("missionId", "candidatId");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_missionId_key" ON "paiements"("missionId");

-- CreateIndex
CREATE INDEX "config_commissions_dureeType_dateEffective_idx" ON "config_commissions"("dureeType", "dateEffective");
