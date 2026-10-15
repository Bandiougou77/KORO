// Pure function, sans dépendance à la base de données — importable depuis les
// composants client (aperçu live /publier, simulateur /commission) comme depuis le serveur.
//
// La commission et les frais sont à la charge de l'ENTREPRISE, ajoutés par-dessus le montant
// convenu — le prestataire reçoit toujours le montant intégral, jamais un montant net réduit.
// (Avant ce changement, c'était l'inverse : la commission était déduite du prestataire.)
export function calculerRepartition(montantBrut: number, tauxCommissionPct: number) {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const commission = round2(montantBrut * (tauxCommissionPct / 100));
  const frais = round2(montantBrut * 0.006);
  const totalEntreprise = round2(montantBrut + commission + frais);
  return { commission, frais, totalEntreprise, montantPrestataire: montantBrut };
}
