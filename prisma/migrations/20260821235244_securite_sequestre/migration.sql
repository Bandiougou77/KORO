-- AlterTable
ALTER TABLE "missions" ADD COLUMN "dateTerminee" DATETIME;

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entrepriseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "documentReference" TEXT,
    "dateVerification" DATETIME,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verifications_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprises" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "signalements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auteurId" TEXT NOT NULL,
    "cibleId" TEXT NOT NULL,
    "missionId" TEXT,
    "motif" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'nouveau',
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "signalements_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "signalements_cibleId_fkey" FOREIGN KEY ("cibleId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "signalements_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "litiges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "ouvertParId" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "elementsFournis" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'ouvert',
    "decision" TEXT,
    "dateOuverture" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateResolution" DATETIME,
    CONSTRAINT "litiges_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "litiges_ouvertParId_fkey" FOREIGN KEY ("ouvertParId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages_internes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "expediteurId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "dateEnvoi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_internes_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "messages_internes_expediteurId_fkey" FOREIGN KEY ("expediteurId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "motDePasseHash" TEXT NOT NULL,
    "paysId" TEXT NOT NULL,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "compteSuspendu" BOOLEAN NOT NULL DEFAULT false,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "pays" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_users" ("dateCreation", "email", "id", "langue", "motDePasseHash", "paysId", "role", "telephone") SELECT "dateCreation", "email", "id", "langue", "motDePasseHash", "paysId", "role", "telephone" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "litiges_missionId_key" ON "litiges"("missionId");

-- CreateIndex
CREATE INDEX "messages_internes_missionId_dateEnvoi_idx" ON "messages_internes"("missionId", "dateEnvoi");
