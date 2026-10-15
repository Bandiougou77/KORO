// Fonctions pures, sans dépendance à la base de données — importable depuis les composants
// client (aperçu /publier, simulateur /commission, textes marketing).
//
// Source d'affichage UNIQUE pour le taux de commission dans les contextes sans mission réelle
// en base (aperçu avant création, pages de contenu). Ne remplace jamais le calcul serveur réel
// (src/lib/commission.ts::getTauxCommission, qui lit ConfigCommission) — si ce taux change un
// jour, cette constante doit être mise à jour en même temps que la configuration en base pour
// rester cohérente, mais seule la configuration en base fait foi pour le calcul effectif.
export const TAUX_COMMISSION_AFFICHAGE = 5;
