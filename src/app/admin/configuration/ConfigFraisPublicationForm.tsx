"use client";

import { useActionState } from "react";
import { definirFraisPublication } from "@/actions/admin";
import { initialActionState } from "@/actions/types";

export function ConfigFraisPublicationForm({
  paysId,
  actifParDefaut,
  montantParDefaut,
}: {
  paysId: string;
  actifParDefaut: boolean;
  montantParDefaut: number;
}) {
  const [state, formAction, pending] = useActionState(definirFraisPublication, initialActionState);

  return (
    <form action={formAction} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
      <input type="hidden" name="paysId" value={paysId} />
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={`actif-${paysId}`}>Statut</label>
        <select id={`actif-${paysId}`} name="actif" defaultValue={actifParDefaut ? "true" : "false"}>
          <option value="false">Gratuit</option>
          <option value="true">Payant</option>
        </select>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={`montant-${paysId}`}>Montant</label>
        <input
          type="number"
          id={`montant-${paysId}`}
          name="montant"
          step="1"
          min="0"
          defaultValue={montantParDefaut}
        />
      </div>
      <button type="submit" className="btn btn-dark" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
      {state.error && <p className="form-error" style={{ margin: 0 }}>{state.error}</p>}
    </form>
  );
}
