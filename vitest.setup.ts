// Garde-fou exécuté avant CHAQUE fichier de test : si DATABASE_URL ne pointe pas exactement
// vers la base de test jetable, on arrête tout immédiatement. Aucune suite de tests ne doit
// jamais pouvoir toucher dev.db ni, a fortiori, la base de production Turso.
const ATTENDU = "file:./prisma/test.db";

if (process.env.DATABASE_URL !== ATTENDU) {
  throw new Error(
    `Refus de lancer les tests : DATABASE_URL="${process.env.DATABASE_URL}" ne correspond pas à la base de ` +
      `test attendue ("${ATTENDU}"). Aucun test ne doit s'exécuter contre dev.db ni la production.`,
  );
}

if (process.env.DATABASE_URL?.includes("turso.io") || process.env.DATABASE_URL?.startsWith("libsql:")) {
  throw new Error("Refus de lancer les tests : DATABASE_URL pointe vers une base distante (Turso).");
}
