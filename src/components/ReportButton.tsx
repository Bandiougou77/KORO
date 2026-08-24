"use client";

import { useActionState, useState } from "react";
import { creerSignalement } from "@/actions/signalements";
import { initialActionState } from "@/actions/types";

export function ReportButton({
  cibleId,
  missionId,
  label = "Signaler",
}: {
  cibleId: string;
  missionId?: string;
  label?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const action = creerSignalement.bind(null, cibleId, missionId ?? null);
  const [state, formAction, pending] = useActionState(action, initialActionState);

  if (!ouvert) {
    return (
      <button type="button" className="btn btn-ghost" onClick={() => setOuvert(true)}>
        {label}
      </button>
    );
  }

  return (
    <form
      action={formAction}
      style={{ border: "1.5px solid var(--line-dark)", borderRadius: 10, padding: 14, maxWidth: 360 }}
    >
      <div className="field" style={{ marginBottom: 10 }}>
        <label htmlFor={`motif-${cibleId}`}>Motif</label>
        <select id={`motif-${cibleId}`} name="motif" defaultValue="autre">
          <option value="non_paiement">Non-paiement</option>
          <option value="guet_apens_suspecte">Guet-apens suspecté</option>
          <option value="menace_extorsion">Menace / extorsion</option>
          <option value="autre">Autre</option>
        </select>
      </div>
      <div className="field" style={{ marginBottom: 10 }}>
        <label htmlFor={`description-${cibleId}`}>Description</label>
        <textarea id={`description-${cibleId}`} name="description" required />
      </div>
      {state.error && <p className="form-error">{state.error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn btn-dark" disabled={pending}>
          {pending ? "Envoi…" : "Envoyer le signalement"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOuvert(false)}>
          Annuler
        </button>
      </div>
    </form>
  );
}
