// Pure function, sans dépendance à la base de données — importable depuis les
// composants client (aperçu live /publier, simulateur /commission) comme depuis le serveur.
export function calculerRepartition(montantBrut: number, tauxCommissionPct: number) {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const commission = round2(montantBrut * (tauxCommissionPct / 100));
  const frais = round2(montantBrut * 0.006);
  const net = round2(montantBrut - commission - frais);
  return { commission, frais, net };
}
