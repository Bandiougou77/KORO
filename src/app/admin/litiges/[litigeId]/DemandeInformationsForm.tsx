"use client";

import { useActionState } from "react";
import { demanderInformationsLitige } from "@/actions/litiges";
import { initialActionState } from "@/actions/types";

export function DemandeInformationsForm({ litigeId }: { litigeId: string }) {
  const action = demanderInformationsLitige.bind(null, litigeId);
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <div className="form-card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginBottom: 12 }}>Demander des informations complémentaires</h3>
      <p className="hint" style={{ marginBottom: 12 }}>
        Le message est envoyé dans la messagerie interne de la mission, visible par les deux parties.
      </p>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <textarea name="message" placeholder="Précisez ce dont vous avez besoin pour trancher…" required rows={3} />
        <button type="submit" className="btn btn-ghost" disabled={pending} style={{ alignSelf: "flex-start" }}>
          {pending ? "Envoi…" : "Envoyer la demande"}
        </button>
        {state.error && <p className="form-error" style={{ margin: 0 }}>{state.error}</p>}
      </form>
    </div>
  );
}
