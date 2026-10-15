import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

// Base de test jetable, recréée à chaque lancement de `vitest run` — jamais dev.db,
// jamais la base de production Turso. Aucune donnée réelle n'est touchée.
const TEST_DB = "./prisma/test.db";

export default function setup() {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const path = TEST_DB + suffix;
    if (existsSync(path)) rmSync(path);
  }

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DB.replace("./", "file:./") },
    stdio: "inherit",
  });
}
