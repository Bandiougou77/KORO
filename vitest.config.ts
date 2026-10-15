import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./vitest.server-only-stub.ts"),
    },
  },
  test: {
    env: {
      DATABASE_URL: "file:./prisma/test.db",
      AUTH_SECRET: "test-secret-vitest-only-not-for-production",
      RATE_LIMIT_HASH_SECRET: "test-hmac-secret-vitest-only-not-for-production",
    },
    // Un seul fichier SQLite partagé par tous les tests : les exécuter en parallèle
    // provoquerait des verrous ("database is locked") entre workers.
    fileParallelism: false,
    globalSetup: "./vitest.global-setup.ts",
    setupFiles: ["./vitest.setup.ts"],
  },
});
