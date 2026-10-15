-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_paiements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "devise" TEXT NOT NULL,
    "moyenPaiement" TEXT,
    "montantBrut" REAL NOT NULL,
    "commission" REAL NOT NULL,
    "fraisPaiement" REAL NOT NULL,
    "montantTotalEntreprise" REAL NOT NULL DEFAULT 0,
    "montantNetCandidat" REAL NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "datePaiement" DATETIME,
    "referencePrestatairePaiement" TEXT,
    CONSTRAINT "paiements_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_paiements" ("commission", "datePaiement", "devise", "fraisPaiement", "id", "missionId", "montantBrut", "montantNetCandidat", "moyenPaiement", "referencePrestatairePaiement", "statut") SELECT "commission", "datePaiement", "devise", "fraisPaiement", "id", "missionId", "montantBrut", "montantNetCandidat", "moyenPaiement", "referencePrestatairePaiement", "statut" FROM "paiements";
DROP TABLE "paiements";
ALTER TABLE "new_paiements" RENAME TO "paiements";
CREATE UNIQUE INDEX "paiements_missionId_key" ON "paiements"("missionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
