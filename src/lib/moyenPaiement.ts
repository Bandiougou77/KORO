// Fonctions pures, sans dépendance à la base de données — importables depuis les
// composants client (ex. RetraitForm) comme depuis le serveur.

export function parseMoyensPaiement(moyensPaiementDisponibles: string): string[] {
  return moyensPaiementDisponibles
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

const MOYEN_PAIEMENT_LABELS: Record<string, string> = {
  orange_money: "Orange Money",
  wave: "Wave",
  moov_money: "Moov Money",
  stripe: "Carte bancaire (Stripe)",
  virement: "Virement bancaire",
};

export function moyenPaiementLabel(moyenPaiement: string): string {
  return MOYEN_PAIEMENT_LABELS[moyenPaiement] ?? moyenPaiement;
}
