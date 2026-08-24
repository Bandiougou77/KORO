"use client";

import { useActionState } from "react";
import { applyCandidature } from "@/actions/candidatures";
import { initialActionState } from "@/actions/types";

export function ApplyForm({ missionId }: { missionId: string }) {
  const action = applyCandidature.bind(null, missionId);
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction}>
      <div className="field" style={{ marginBottom: 14 }}>
        <label htmlFor="message">Message (optionnel)</label>
        <textarea id="message" name="message" placeholder="Présentez-vous en quelques mots..." />
      </div>

      {state.error && <p className="form-error">{state.error}</p>}

      <button type="submit" className="btn btn-gold btn-lg" style={{ width: "100%", justifyContent: "center" }} disabled={pending}>
        {pending ? "Envoi…" : "Je postule à cette mission"}
      </button>
    </form>
  );
}
