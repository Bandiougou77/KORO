"use client";

import { useActionState } from "react";
import { acceptCandidature } from "@/actions/candidatures";
import { initialActionState } from "@/actions/types";
import { moyenPaiementLabel } from "@/lib/moyenPaiement";

export function AcceptForm({
  candidatureId,
  moyensDisponibles,
}: {
  candidatureId: string;
  moyensDisponibles: string[];
}) {
  const action = acceptCandidature.bind(null, candidatureId);
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <select name="moyenPaiement" defaultValue={moyensDisponibles[0]} aria-label="Moyen de paiement">
          {moyensDisponibles.map((m) => (
            <option key={m} value={m}>
              {moyenPaiementLabel(m)}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-dark" disabled={pending}>
          {pending ? "…" : "Accepter"}
        </button>
      </div>
      {state.error && <p className="form-error" style={{ margin: 0 }}>{state.error}</p>}
    </form>
  );
}
