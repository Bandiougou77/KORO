"use client";

import { useActionState } from "react";
import { demanderRetrait } from "@/actions/solde";
import { initialActionState } from "@/actions/types";
import { moyenPaiementLabel } from "@/lib/moyenPaiement";

export function RetraitForm({
  soldeDisponible,
  moyenPaiementPrefere,
  identifiantPaiement,
}: {
  soldeDisponible: number;
  moyenPaiementPrefere: string | null;
  identifiantPaiement: string | null;
}) {
  const [state, formAction, pending] = useActionState(demanderRetrait, initialActionState);
  const profilIncomplet = !moyenPaiementPrefere || !identifiantPaiement;

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
        <div className="field">
          <span className="hint" style={{ display: "block", marginBottom: 4 }}>
            Destination du retrait
          </span>
          {profilIncomplet ? (
            <p className="form-error">
              Aucun moyen de paiement enregistré sur votre profil. Contactez le support pour le configurer avant de
              pouvoir retirer de l&apos;argent.
            </p>
          ) : (
            <p style={{ fontWeight: 600 }}>
              {moyenPaiementLabel(moyenPaiementPrefere)} · {identifiantPaiement}
            </p>
          )}
        </div>
      </fieldset>

      {state.error && <p className="form-error">{state.error}</p>}

      <button
        type="submit"
        className="btn btn-gold btn-lg"
        style={{ width: "100%", justifyContent: "center" }}
        disabled={pending || soldeDisponible <= 0 || profilIncomplet}
      >
        {pending ? "Retrait en cours…" : "Retirer mon argent"}
      </button>
    </form>
  );
}
