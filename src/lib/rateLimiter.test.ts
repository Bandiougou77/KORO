import { describe, it, expect, afterEach, vi } from "vitest";
import { LimiteurMemoireFactice, verifierLimiteConnexion, _resetLimiteursPourTests } from "@/lib/rateLimiter";

// Simule une vraie panne Upstash AU MOMENT DE L'APPEL — pas une config absente (déjà couverte
// plus bas). construireLimiteurs() réussit (URL/token présents), mais .limit() échoue, comme un
// vrai Upstash indisponible/réseau en panne/token révoqué le ferait.
vi.mock("@upstash/redis", () => ({
  Redis: class {},
}));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() {
      return {};
    }
    async limit(): Promise<{ success: boolean }> {
      throw new Error("Upstash indisponible (simulation de test)");
    }
  },
}));

describe("LimiteurMemoireFactice", () => {
  it("autorise jusqu'à la limite puis bloque dans la même fenêtre", async () => {
    const limiteur = new LimiteurMemoireFactice(3, 60_000);
    expect((await limiteur.limit("x")).success).toBe(true);
    expect((await limiteur.limit("x")).success).toBe(true);
    expect((await limiteur.limit("x")).success).toBe(true);
    expect((await limiteur.limit("x")).success).toBe(false);
  });

  it("réinitialise après l'expiration de la fenêtre", async () => {
    const limiteur = new LimiteurMemoireFactice(1, 10);
    expect((await limiteur.limit("y")).success).toBe(true);
    expect((await limiteur.limit("y")).success).toBe(false);
    await new Promise((r) => setTimeout(r, 25));
    expect((await limiteur.limit("y")).success).toBe(true);
  });

  it("isole les clés différentes l'une de l'autre", async () => {
    const limiteur = new LimiteurMemoireFactice(1, 60_000);
    expect((await limiteur.limit("a")).success).toBe(true);
    expect((await limiteur.limit("b")).success).toBe(true);
  });
});

describe("verifierLimiteConnexion", () => {
  const envAvant = { ...process.env };

  afterEach(() => {
    process.env = { ...envAvant };
    _resetLimiteursPourTests();
  });

  it("refuse en service_indisponible si RATE_LIMIT_HASH_SECRET est absent, même en mode mémoire", async () => {
    process.env.RATE_LIMIT_FAKE = "1";
    delete process.env.RATE_LIMIT_HASH_SECRET;
    _resetLimiteursPourTests();

    const resultat = await verifierLimiteConnexion("203.0.113.9", "quelqu-un@example.com");

    expect(resultat.autorise).toBe(false);
    if (!resultat.autorise) expect(resultat.raison).toBe("service_indisponible");
  });

  it("le hash dépend du secret : changer de secret change la clé dérivée pour le même email", async () => {
    // Même instance de limiteur tout du long (PAS de _resetLimiteursPourTests entre les deux
    // phases) : seul process.env.RATE_LIMIT_HASH_SECRET change. hashIdentifiant() le relit à
    // chaque appel, indépendamment du cache des limiteurs eux-mêmes.
    process.env.RATE_LIMIT_FAKE = "1";
    process.env.RATE_LIMIT_HASH_SECRET = "secret-A";
    _resetLimiteursPourTests();

    for (let i = 0; i < 5; i++) {
      await verifierLimiteConnexion("203.0.113.10", "cible@example.com");
    }
    const bloqueAvecSecretA = await verifierLimiteConnexion("203.0.113.10", "cible@example.com");
    expect(bloqueAvecSecretA.autorise).toBe(false); // compteur épuisé sous secret-A

    // Même email, même IP, SEUL le secret change : si le hash en dépendait pas (SHA-256 nu),
    // on retomberait sur la même clé et resterait bloqué. Avec HMAC, la clé dérivée change.
    process.env.RATE_LIMIT_HASH_SECRET = "secret-B";
    const autoriseAvecSecretB = await verifierLimiteConnexion("203.0.113.10", "cible@example.com");
    expect(autoriseAvecSecretB.autorise).toBe(true);
  });

  it("refuse en service_indisponible si ni RATE_LIMIT_FAKE ni les identifiants Upstash ne sont présents", async () => {
    delete process.env.RATE_LIMIT_FAKE;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    _resetLimiteursPourTests();

    const resultat = await verifierLimiteConnexion("203.0.113.1", "test@example.com");

    expect(resultat.autorise).toBe(false);
    if (!resultat.autorise) expect(resultat.raison).toBe("service_indisponible");
  });

  it("refuse en service_indisponible si Upstash est configuré mais échoue réellement à l'appel (pas juste une config absente)", async () => {
    delete process.env.RATE_LIMIT_FAKE;
    process.env.UPSTASH_REDIS_REST_URL = "https://fake-test-only.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token-test-only";
    _resetLimiteursPourTests();

    const resultat = await verifierLimiteConnexion("203.0.113.20", "quelqu-un@example.com");

    expect(resultat.autorise).toBe(false);
    if (!resultat.autorise) expect(resultat.raison).toBe("service_indisponible");
  });

  it("fonctionne via le repli mémoire explicite en mode test (RATE_LIMIT_FAKE=1)", async () => {
    process.env.RATE_LIMIT_FAKE = "1";
    _resetLimiteursPourTests();

    const resultat = await verifierLimiteConnexion("203.0.113.2", "autre@example.com");
    expect(resultat.autorise).toBe(true);
  });

  it("applique la même limite qu'un email existe en base ou non (calcul avant toute recherche en base)", async () => {
    process.env.RATE_LIMIT_FAKE = "1";
    _resetLimiteursPourTests();

    for (let i = 0; i < 5; i++) {
      await verifierLimiteConnexion("203.0.113.3", "jamais-cree@example.com");
    }
    const resultat = await verifierLimiteConnexion("203.0.113.3", "jamais-cree@example.com");

    expect(resultat.autorise).toBe(false);
  });

  it("RATE_LIMIT_FAKE est refusé si NODE_ENV=production (garde-fou anti-bascule accidentelle)", async () => {
    process.env.RATE_LIMIT_FAKE = "1";
    vi.stubEnv("NODE_ENV", "production");
    _resetLimiteursPourTests();

    const resultat = await verifierLimiteConnexion("203.0.113.4", "x@example.com");

    expect(resultat.autorise).toBe(false);
    if (!resultat.autorise) expect(resultat.raison).toBe("service_indisponible");

    vi.unstubAllEnvs();
  });
});
