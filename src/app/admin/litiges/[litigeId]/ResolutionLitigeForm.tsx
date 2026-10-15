"use client";

import { useActionState, useState } from "react";
import { resoudreLitige } from "@/actions/litiges";
import { initialActionState } from "@/actions/types";

const LABELS_DECISION: Record<string, string> = {
  paiement_candidat: "Libérer le paiement au prestataire (litige en sa faveur)",
  remboursement_entreprise: "Rembourser l'entreprise intégralement",
  partage: "Partager : rembourser l'entreprise et verser une part au prestataire",
  compte_suspendu: "Suspendre un compte, sans mouvement financier",
};

export function ResolutionLitigeForm({
  litigeId,
  entrepriseId,
  candidatId,
}: {
  litigeId: string;
  entrepriseId: string;
  candidatId?: string;
}) {
  const action = resoudreLitige.bind(null, litigeId);
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [decision, setDecision] = useState<string>("paiement_candidat");

  return (
    <div className="form-card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginBottom: 12 }}>Trancher le litige</h3>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm("Confirmer cette décision ? Elle est historisée et, selon le cas, déclenche un versement ou un remboursement simulé.")) {
            e.preventDefault();
          }
        }}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="decision">Décision</label>
          <select id="decision" name="decision" value={decision} onChange={(e) => setDecision(e.target.value)}>
            {Object.entries(LABELS_DECISION).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {decision === "partage" && (
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="montantVersePrestataire">Montant à verser au prestataire</label>
            <input type="number" id="montantVersePrestataire" name="montantVersePrestataire" step="0.01" min="0" />
          </div>
        )}

        {decision === "compte_suspendu" && (
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="utilisateurASuspendre">Compte à suspendre</label>
            <select id="utilisateurASuspendre" name="utilisateurASuspendre" defaultValue="">
              <option value="">— Sélectionner —</option>
              <option value={entrepriseId}>Entreprise</option>
              {candidatId && <option value={candidatId}>Prestataire</option>}
            </select>
          </div>
        )}

        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="motifDecision">Motif de la décision</label>
          <textarea id="motifDecision" name="motifDecision" required rows={3} placeholder="Justification, consultée par les deux parties…" />
        </div>

        <button type="submit" className="btn btn-dark" disabled={pending} style={{ alignSelf: "flex-start" }}>
          {pending ? "Enregistrement…" : "Valider la décision"}
        </button>
        {state.error && <p className="form-error" style={{ margin: 0 }}>{state.error}</p>}
      </form>
    </div>
  );
}
