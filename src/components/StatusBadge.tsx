const missionLabels: Record<string, string> = {
  brouillon: "Brouillon",
  publiee: "Publiée",
  confirmee: "Confirmée",
  paiement_securise: "Paiement sécurisé",
  en_cours: "En cours",
  terminee: "Terminée",
  payee: "Payée",
  annulee: "Annulée",
  litige: "Litige",
  remboursee: "Remboursée",
};

const candidatureLabels: Record<string, string> = {
  envoyee: "Envoyée",
  acceptee: "Acceptée",
  declinee: "Déclinée",
};

export function StatusBadge({ statut, kind }: { statut: string; kind: "mission" | "candidature" }) {
  const label = (kind === "mission" ? missionLabels : candidatureLabels)[statut] ?? statut;
  const isPositive = statut === "acceptee" || statut === "payee" || statut === "publiee";
  const isLitige = statut === "litige" || statut === "remboursee";

  let style: React.CSSProperties | undefined;
  if (isLitige) style = { background: "rgba(179,64,42,0.25)", color: "#FFB8A8" };
  else if (!isPositive) style = { background: "var(--paper-dim)", color: "var(--ink)" };

  return (
    <span className="pipe-chip" style={style}>
      {label}
    </span>
  );
}
