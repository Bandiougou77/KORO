"use client";

import { useActionState } from "react";
import Link from "next/link";
import { demanderResetMotDePasse } from "@/actions/auth";
import { initialActionState } from "@/actions/types";

export default function MotDePasseOubliePage() {
  const [state, formAction, pending] = useActionState(demanderResetMotDePasse, initialActionState);

  return (
    <div className="page-head">
      <div className="wrap" style={{ maxWidth: 480 }}>
        <div className="crumb">
          <Link href="/">Accueil</Link> · Mot de passe oublié
        </div>
        <h1 style={{ fontSize: 30, marginBottom: 24 }}>Mot de passe oublié</h1>

        {state.success ? (
          <p className="status-banner">
            <span className="status-dot"></span>
            <span>
              Si un compte existe avec cette adresse, un email contenant un lien de réinitialisation vient de
              lui être envoyé. Vérifiez vos spams si vous ne le voyez pas sous quelques minutes.
            </span>
          </p>
        ) : (
          <form action={formAction} className="form-card" aria-label="Demande de réinitialisation">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" required />
            </div>

            {state.error && <p className="form-error">{state.error}</p>}

            <button
              type="submit"
              className="btn btn-gold btn-lg"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={pending}
            >
              {pending ? "Envoi…" : "Recevoir un lien de réinitialisation"}
            </button>
          </form>
        )}

        <p className="hint" style={{ marginTop: 16, textAlign: "center" }}>
          <Link href="/connexion" style={{ textDecoration: "underline" }}>
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
