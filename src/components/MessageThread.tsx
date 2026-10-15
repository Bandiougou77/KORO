"use client";

import { useActionState } from "react";
import { envoyerMessage } from "@/actions/messages";
import { initialActionState } from "@/actions/types";

export type MessageThreadMessage = {
  id: string;
  contenu: string;
  dateEnvoi: string | Date;
  expediteurId: string;
  expediteurLabel: string;
};

export function MessageThread({
  missionId,
  messages,
  currentUserId,
  lectureSeule = false,
}: {
  missionId: string;
  messages: MessageThreadMessage[];
  currentUserId: string;
  // Pour un admin qui consulte le dossier sans être partie prenante de la mission —
  // envoyerMessage() refuserait son envoi (voir actions/messages.ts::verifierParticipant) ;
  // utilise plutôt demanderInformationsLitige pour écrire dans ce fil depuis l'admin.
  lectureSeule?: boolean;
}) {
  const action = envoyerMessage.bind(null, missionId);
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <div style={{ border: "1.5px solid var(--line-dark)", borderRadius: 12, padding: 16, marginTop: 16 }}>
      <div style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: 11.5, opacity: 0.55, textTransform: "uppercase", marginBottom: 10 }}>
        Messagerie interne
      </div>

      {messages.length === 0 ? (
        <p className="hint" style={{ marginBottom: 12 }}>Aucun message pour le moment.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, maxHeight: 260, overflowY: "auto" }}>
          {messages.map((m) => {
            const deMoi = m.expediteurId === currentUserId;
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: deMoi ? "flex-end" : "flex-start",
                  background: deMoi ? "var(--paper-dim)" : "var(--paper)",
                  border: "1px solid var(--line-dark)",
                  borderRadius: 10,
                  padding: "8px 12px",
                  maxWidth: "85%",
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 3 }}>
                  {deMoi ? "Vous" : m.expediteurLabel} · {new Date(m.dateEnvoi).toLocaleString("fr-FR")}
                </div>
                <div style={{ fontSize: 14 }}>{m.contenu}</div>
              </div>
            );
          })}
        </div>
      )}

      {!lectureSeule && (
        <>
          <form action={formAction} style={{ display: "flex", gap: 8 }}>
            <input type="text" name="contenu" placeholder="Écrire un message..." required style={{ flex: 1 }} />
            <button type="submit" className="btn btn-dark" disabled={pending}>
              Envoyer
            </button>
          </form>
          {state.error && <p className="form-error" style={{ marginTop: 10, marginBottom: 0 }}>{state.error}</p>}
        </>
      )}
    </div>
  );
}
