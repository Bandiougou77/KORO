-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_litiges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "ouvertParId" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "elementsFournis" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'ouvert',
    "decision" TEXT,
    "motifDecision" TEXT,
    "resoluParId" TEXT,
    "montantRembourseEntreprise" REAL,
    "montantVersePrestataire" REAL,
    "dateOuverture" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateResolution" DATETIME,
    CONSTRAINT "litiges_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "litiges_ouvertParId_fkey" FOREIGN KEY ("ouvertParId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "litiges_resoluParId_fkey" FOREIGN KEY ("resoluParId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_litiges" ("dateOuverture", "dateResolution", "decision", "elementsFournis", "id", "missionId", "motif", "ouvertParId", "statut") SELECT "dateOuverture", "dateResolution", "decision", "elementsFournis", "id", "missionId", "motif", "ouvertParId", "statut" FROM "litiges";
DROP TABLE "litiges";
ALTER TABLE "new_litiges" RENAME TO "litiges";
CREATE UNIQUE INDEX "litiges_missionId_key" ON "litiges"("missionId");
CREATE INDEX "litiges_statut_idx" ON "litiges"("statut");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
