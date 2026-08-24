import { describe, it, expect } from "vitest";
import { calculerRepartition } from "./repartition";

describe("calculerRepartition", () => {
  it("mission courte de 200€ : commission 12,00€, frais 1,20€, net 186,80€", () => {
    expect(calculerRepartition(200, 6)).toEqual({ commission: 12, frais: 1.2, net: 186.8 });
  });

  it("mission longue de 2100€ : taux 5%", () => {
    expect(calculerRepartition(2100, 5)).toEqual({ commission: 105, frais: 12.6, net: 1982.4 });
  });

  it("arrondit à 2 décimales", () => {
    const { commission, frais, net } = calculerRepartition(12.4, 6);
    expect(commission).toBe(0.74);
    expect(frais).toBe(0.07);
    expect(net).toBe(11.59);
  });
});
