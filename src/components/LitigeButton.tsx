"use client";

import { useActionState, useState } from "react";
import { ouvrirLitige } from "@/actions/litiges";
import { initialActionState } from "@/actions/types";

export function LitigeButton({ missionId }: { missionId: string }) {
  const [ouvert, setOuvert] = useState(false);
  const action = ouvrirLitige.bind(null, missionId);
  const [state, formAction, pending] = useActionState(action, initialActionState);

  if (!ouvert) {
    return (
      <button type="button" className="btn btn-ghost" onClick={() => setOuvert(true)}>
        Signaler un problème
      </button>
    );
  }

  return (
    <form
      action={formAction}
      style={{ border: "1.5px solid var(--line-dark)", borderRadius: 10, padding: 14, maxWidth: 400, marginTop: 10 }}
    >
      <div className="field" style={{ marginBottom: 10 }}>
        <label htmlFor={`litige-motif-${missionId}`}>Motif du litige</label>
        <input type="text" id={`litige-motif-${missionId}`} name="motif" placeholder="Ex. mission non conforme, non-paiement..." required />
      </div>
      <div className="field" style={{ marginBottom: 10 }}>
        <label htmlFor={`litige-description-${missionId}`}>Ce qui s&apos;est passé</label>
        <textarea id={`litige-description-${missionId}`} name="description" required />
      </div>
      {state.error && <p className="form-error">{state.error}</p>}
      <p className="hint" style={{ marginBottom: 10 }}>
        Le paiement reste bloqué le temps de l&apos;examen — aucune des deux parties n&apos;est payée ou remboursée automatiquement.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn btn-dark" disabled={pending}>
          {pending ? "Envoi…" : "Ouvrir le litige"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOuvert(false)}>
          Annuler
        </button>
      </div>
    </form>
  );
}
