import { describe, it, expect } from "vitest";
import { assertTransitionAutorisee, TransitionInterditeError } from "@/lib/missionTransitions";

describe("assertTransitionAutorisee", () => {
  it("autorise les transitions prévues du cycle de vie normal", () => {
    expect(() => assertTransitionAutorisee("brouillon", "publiee")).not.toThrow();
    expect(() => assertTransitionAutorisee("publiee", "paiement_securise")).not.toThrow();
    expect(() => assertTransitionAutorisee("paiement_securise", "terminee")).not.toThrow();
    expect(() => assertTransitionAutorisee("terminee", "payee")).not.toThrow();
    expect(() => assertTransitionAutorisee("terminee", "litige")).not.toThrow();
    expect(() => assertTransitionAutorisee("litige", "payee")).not.toThrow();
    expect(() => assertTransitionAutorisee("litige", "remboursee")).not.toThrow();
    expect(() => assertTransitionAutorisee("litige", "terminee")).not.toThrow();
  });

  it("ne fait rien si l'état de départ et d'arrivée sont identiques (idempotence)", () => {
    expect(() => assertTransitionAutorisee("terminee", "terminee")).not.toThrow();
  });

  it("refuse les transitions interdites par le cycle de vie", () => {
    expect(() => assertTransitionAutorisee("terminee", "paiement_securise")).toThrow(TransitionInterditeError);
    expect(() => assertTransitionAutorisee("payee", "remboursee")).toThrow(TransitionInterditeError);
    expect(() => assertTransitionAutorisee("remboursee", "payee")).toThrow(TransitionInterditeError);
    expect(() => assertTransitionAutorisee("annulee", "publiee")).toThrow(TransitionInterditeError);
    expect(() => assertTransitionAutorisee("brouillon", "terminee")).toThrow(TransitionInterditeError);
  });

  it("les états terminaux (payee, remboursee, annulee) n'autorisent plus aucune transition", () => {
    expect(() => assertTransitionAutorisee("payee", "litige")).toThrow(TransitionInterditeError);
    expect(() => assertTransitionAutorisee("remboursee", "litige")).toThrow(TransitionInterditeError);
    expect(() => assertTransitionAutorisee("annulee", "litige")).toThrow(TransitionInterditeError);
  });
});
