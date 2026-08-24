"use client";

import { useActionState } from "react";
import { demanderRetrait } from "@/actions/solde";
import { initialActionState } from "@/actions/types";
import { moyenPaiementLabel } from "@/lib/moyenPaiement";

export function RetraitForm({
  soldeDisponible,
  moyensDisponibles,
  identifiantParDefaut,
}: {
  soldeDisponible: number;
  moyensDisponibles: string[];
  identifiantParDefaut: string;
}) {
  const [state, formAction, pending] = useActionState(demanderRetrait, initialActionState);

  return (
    <form action={formAction} className="form-card" aria-label="Retirer mon argent">
      <fieldset>
        <legend>Retirer mon argent</legend>
        <div className="field">
          <label htmlFor="montant">Montant à retirer</label>
          <input
            type="number"
            id="montant"
            name="montant"
            step="1"
            min="0"
            max={soldeDisponible}
            defaultValue={soldeDisponible || undefined}
            required
          />
          <p className="hint">Jusqu&apos;à hauteur de votre solde disponible.</p>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="moyenRetrait">Moyen de retrait</label>
            <select id="moyenRetrait" name="moyenRetrait" defaultValue={moyensDisponibles[0]}>
              {moyensDisponibles.map((m) => (
                <option key={m} value={m}>
                  {moyenPaiementLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="identifiantDestinataire">Numéro / identifiant</label>
            <input
              type="text"
              id="identifiantDestinataire"
              name="identifiantDestinataire"
              defaultValue={identifiantParDefaut}
              required
            />
          </div>
        </div>
      </fieldset>

      {state.error && <p className="form-error">{state.error}</p>}

      <button
        type="submit"
        className="btn btn-gold btn-lg"
        style={{ width: "100%", justifyContent: "center" }}
        disabled={pending || soldeDisponible <= 0}
      >
        {pending ? "Retrait en cours…" : "Retirer mon argent"}
      </button>
    </form>
  );
}
