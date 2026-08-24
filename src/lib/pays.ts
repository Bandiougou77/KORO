import { db } from "@/lib/db";

export { parseMoyensPaiement, moyenPaiementLabel } from "@/lib/moyenPaiement";

// Un seul pays est actif au lancement (Mali). Tant que c'est le cas, l'inscription
// n'a pas besoin d'exposer de sélecteur de pays — dès qu'un 2e pays sera activé,
// c'est ici qu'il faudra remplacer cet appel par un vrai choix utilisateur.
export async function getPaysActif() {
  const pays = await db.pays.findFirst({ where: { actif: true } });
  if (!pays) throw new Error("Aucun pays actif configuré.");
  return pays;
}
