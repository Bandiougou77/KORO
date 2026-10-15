import type { StatutMission } from "@/generated/prisma/enums";

// Carte explicite des transitions autorisées pour Mission.statut — centralise ce qui était
// jusqu'ici implicite (chaque action vérifiait son propre cas sans vue d'ensemble). Aucune
// action ne doit faire transiter une mission en dehors de ce graphe ; aucune ne doit non plus
// accepter un statut envoyé par le client (toutes les transitions ci-dessous sont déclenchées
// par de la logique serveur, jamais par une valeur de formulaire).
const TRANSITIONS_AUTORISEES: Record<StatutMission, StatutMission[]> = {
  brouillon: ["publiee", "annulee"],
  publiee: ["paiement_securise", "annulee"],
  confirmee: ["paiement_securise", "annulee"],
  paiement_securise: ["terminee", "litige"],
  en_cours: ["terminee", "litige"],
  terminee: ["payee", "litige"],
  // Issues possibles d'un litige résolu : paiement au prestataire, remboursement à
  // l'entreprise, ou retour à "terminee" si l'admin redonne la main (pas de régression ici,
  // juste la même transition que depuis "terminee").
  litige: ["payee", "remboursee", "terminee"],
  payee: [],
  remboursee: [],
  annulee: [],
};

export class TransitionInterditeError extends Error {}

export function assertTransitionAutorisee(de: StatutMission, vers: StatutMission): void {
  if (de === vers) return; // no-op toléré (idempotence)
  const autorisees = TRANSITIONS_AUTORISEES[de] ?? [];
  if (!autorisees.includes(vers)) {
    throw new TransitionInterditeError(`Transition de mission interdite : ${de} → ${vers}`);
  }
}
