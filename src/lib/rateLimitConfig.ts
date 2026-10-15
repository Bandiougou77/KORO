// Seuils centralisés pour la limitation des tentatives de connexion (src/lib/rateLimiter.ts).
// Modifier ces valeurs n'impacte rien d'autre dans le code.
export const RATE_LIMIT_CONFIG = {
  // Protège contre un script qui essaie beaucoup de comptes depuis une seule source.
  ip: { limite: 20, fenetreSecondes: 10 * 60 },
  // Protège un compte ciblé même si l'attaquant change d'IP (identifiant = email normalisé).
  compte: { limite: 5, fenetreSecondes: 15 * 60 },
} as const;
