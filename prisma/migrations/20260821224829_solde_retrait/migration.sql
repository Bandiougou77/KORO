-- CreateTable
CREATE TABLE "soldes" (
    "candidatId" TEXT NOT NULL PRIMARY KEY,
    "montantDisponible" REAL NOT NULL DEFAULT 0,
    "devise" TEXT NOT NULL,
    "dateMaj" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "soldes_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "profils_candidats" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mouvements_solde" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "soldeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "missionId" TEXT,
    "retraitId" TEXT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mouvements_solde_soldeId_fkey" FOREIGN KEY ("soldeId") REFERENCES "soldes" ("candidatId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "mouvements_solde_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "mouvements_solde_retraitId_fkey" FOREIGN KEY ("retraitId") REFERENCES "retraits" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "retraits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidatId" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "devise" TEXT NOT NULL,
    "moyenRetrait" TEXT NOT NULL,
    "identifiantDestinataire" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_cours',
    "dateDemande" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateTraitement" DATETIME,
    "referencePrestatairePaiement" TEXT,
    CONSTRAINT "retraits_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "profils_candidats" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);
