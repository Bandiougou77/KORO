import { describe, it, expect } from "vitest";
import { calculerRepartition } from "./repartition";

describe("calculerRepartition", () => {
  it("mission de 100 000 à 5% : commission 5 000, frais 600, total entreprise 105 600, prestataire reçoit 100 000 intégral", () => {
    expect(calculerRepartition(100000, 5)).toEqual({
      commission: 5000,
      frais: 600,
      totalEntreprise: 105600,
      montantPrestataire: 100000,
    });
  });

  it("mission de 2100€ à 5%", () => {
    expect(calculerRepartition(2100, 5)).toEqual({
      commission: 105,
      frais: 12.6,
      totalEntreprise: 2217.6,
      montantPrestataire: 2100,
    });
  });

  it("arrondit à 2 décimales", () => {
    const { commission, frais, totalEntreprise } = calculerRepartition(12.4, 6);
    expect(commission).toBe(0.74);
    expect(frais).toBe(0.07);
    expect(totalEntreprise).toBe(13.21);
  });

  it("le prestataire reçoit toujours le montant intégral, jamais réduit par la commission ou les frais", () => {
    const { montantPrestataire } = calculerRepartition(50000, 5);
    expect(montantPrestataire).toBe(50000);
  });
});
