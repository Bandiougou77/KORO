-- CreateTable
CREATE TABLE "comptes_bancaires_admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paysId" TEXT NOT NULL,
    "devise" TEXT NOT NULL,
    "ibanOuEquivalent" TEXT NOT NULL,
    "nomTitulaire" TEXT NOT NULL,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comptes_bancaires_admin_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "pays" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "virements_commission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paysId" TEXT NOT NULL,
    "devise" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "compteBancaireId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_cours',
    "dateDemande" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateTraitement" DATETIME,
    "referencePrestatairePaiement" TEXT,
    CONSTRAINT "virements_commission_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "pays" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "virements_commission_compteBancaireId_fkey" FOREIGN KEY ("compteBancaireId") REFERENCES "comptes_bancaires_admin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
