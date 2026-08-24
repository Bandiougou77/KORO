import type { Devise } from "@/generated/prisma/enums";

export function formatMontant(montant: number, devise: Devise, unite?: "h" | "mois"): string {
  const suffix = unite ? `/${unite}` : "";
  if (devise === "EUR") {
    return (
      montant.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
      " €" +
      suffix
    );
  }
  return Math.round(montant).toLocaleString("fr-FR") + " FCFA" + suffix;
}

export function uniteFromTypeTarif(typeTarif: string): "h" | "mois" | undefined {
  if (typeTarif === "horaire") return "h";
  if (typeTarif === "mensuel") return "mois";
  return undefined;
}
