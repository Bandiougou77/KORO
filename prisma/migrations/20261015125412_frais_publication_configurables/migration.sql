-- CreateTable
CREATE TABLE "config_frais_publication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paysId" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT false,
    "montant" REAL NOT NULL DEFAULT 0,
    "devise" TEXT NOT NULL,
    "dateEffective" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "config_frais_publication_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "pays" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "frais_publication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "devise" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'gratuit',
    "datePaiement" DATETIME,
    "referencePrestatairePaiement" TEXT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "frais_publication_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "config_frais_publication_paysId_dateEffective_idx" ON "config_frais_publication"("paysId", "dateEffective");

-- CreateIndex
CREATE UNIQUE INDEX "frais_publication_missionId_key" ON "frais_publication"("missionId");
