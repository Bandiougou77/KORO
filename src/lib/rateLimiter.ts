import "server-only";
import { createHmac } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMIT_CONFIG } from "./rateLimitConfig";

export interface RateLimiterPort {
  limit(key: string): Promise<{ success: boolean }>;
}

// Repli explicite pour le développement local SANS compte Upstash — jamais activé
// implicitement : exige RATE_LIMIT_FAKE="1" ET refuse de démarrer si NODE_ENV=production,
// pour qu'il ne puisse jamais finir par désactiver silencieusement la protection en prod.
// Fenêtre fixe (pas glissante) : suffisant pour développer/tester en local, pas utilisé en prod.
export class LimiteurMemoireFactice implements RateLimiterPort {
  private compteurs = new Map<string, { compte: number; expireA: number }>();

  constructor(private readonly limite: number, private readonly fenetreMs: number) {}

  async limit(key: string): Promise<{ success: boolean }> {
    const maintenant = Date.now();
    const entree = this.compteurs.get(key);
    if (!entree || entree.expireA < maintenant) {
      this.compteurs.set(key, { compte: 1, expireA: maintenant + this.fenetreMs });
      return { success: true };
    }
    entree.compte += 1;
    return { success: entree.compte <= this.limite };
  }
}

type Limiteurs = { ip: RateLimiterPort; compte: RateLimiterPort };

let limiteursCache: Limiteurs | null = null;

function construireLimiteurs(): Limiteurs {
  if (process.env.RATE_LIMIT_FAKE === "1") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RATE_LIMIT_FAKE ne doit jamais être activé en production.");
    }
    return {
      ip: new LimiteurMemoireFactice(RATE_LIMIT_CONFIG.ip.limite, RATE_LIMIT_CONFIG.ip.fenetreSecondes * 1000),
      compte: new LimiteurMemoireFactice(RATE_LIMIT_CONFIG.compte.limite, RATE_LIMIT_CONFIG.compte.fenetreSecondes * 1000),
    };
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN manquants : impossible de protéger la connexion contre le brute-force.",
    );
  }

  const redis = new Redis({ url, token });
  return {
    ip: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_CONFIG.ip.limite, `${RATE_LIMIT_CONFIG.ip.fenetreSecondes} s`),
      prefix: "koro:ratelimit:ip",
    }),
    compte: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_CONFIG.compte.limite, `${RATE_LIMIT_CONFIG.compte.fenetreSecondes} s`),
      prefix: "koro:ratelimit:compte",
    }),
  };
}

function getLimiteurs(): Limiteurs {
  if (!limiteursCache) {
    limiteursCache = construireLimiteurs();
  }
  return limiteursCache;
}

// Exposé uniquement pour les tests : force la reconstruction des limiteurs au prochain appel
// (les tests changent process.env.RATE_LIMIT_FAKE entre les cas).
export function _resetLimiteursPourTests(): void {
  limiteursCache = null;
}

// HMAC plutôt qu'un simple hash : une fuite des clés Redis (dump, token Upstash compromis,
// incident côté prestataire) ne doit pas permettre de retrouver les adresses email par
// dictionnaire/rainbow table. Un SHA-256 nu serait cassable ainsi (format d'email très
// contraint, domaines courants) ; le secret rend ce calcul impossible sans lui.
function hashIdentifiant(valeur: string): string {
  const secret = process.env.RATE_LIMIT_HASH_SECRET;
  if (!secret) {
    throw new Error("RATE_LIMIT_HASH_SECRET manquant : impossible de hasher l'identifiant en sécurité.");
  }
  return createHmac("sha256", secret).update(valeur.trim().toLowerCase()).digest("hex");
}

export type ResultatLimiteConnexion =
  | { autorise: true }
  | { autorise: false; raison: "limite_depassee" | "service_indisponible" };

// Calculée sur l'email TEL QUE SOUMIS, avant toute recherche en base — un email inexistant
// suit exactement le même chemin qu'un email existant, pour qu'aucune différence de
// comportement entre les deux ne puisse servir à deviner si un compte existe.
// Ne journalise jamais l'email en clair ni le mot de passe.
export async function verifierLimiteConnexion(ip: string, emailSoumis: string): Promise<ResultatLimiteConnexion> {
  try {
    const { ip: limiteurIp, compte: limiteurCompte } = getLimiteurs();
    const [resultatIp, resultatCompte] = await Promise.all([
      limiteurIp.limit(`ip:${ip}`),
      limiteurCompte.limit(`compte:${hashIdentifiant(emailSoumis)}`),
    ]);

    if (!resultatIp.success || !resultatCompte.success) {
      return { autorise: false, raison: "limite_depassee" };
    }
    return { autorise: true };
  } catch {
    // Upstash indisponible (ou configuration manquante) : on refuse plutôt que de laisser
    // passer sans protection — voir LimiteurMemoireFactice pour le repli dev local explicite.
    return { autorise: false, raison: "service_indisponible" };
  }
}
