"use client";

import { useActionState } from "react";
import { transfererCommission } from "@/actions/revenus";
import { initialActionState } from "@/actions/types";

export function TransfererForm({
  paysId,
  compteBancaireId,
  montantDisponible,
}: {
  paysId: string;
  compteBancaireId: string;
  montantDisponible: number;
}) {
  const action = transfererCommission.bind(null, paysId);
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
      <input type="hidden" name="compteBancaireId" value={compteBancaireId} />
      <div>
        <input
          type="number"
          name="montant"
          step="1"
          min="0"
          max={montantDisponible}
          defaultValue={Math.floor(montantDisponible) || undefined}
          required
          aria-label="Montant à transférer"
        />
        {state.error && <p className="form-error" style={{ marginTop: 8, marginBottom: 0 }}>{state.error}</p>}
      </div>
      <button type="submit" className="btn btn-gold" disabled={pending || montantDisponible <= 0}>
        {pending ? "Transfert…" : "Transférer vers mon compte bancaire"}
      </button>
    </form>
  );
}
