"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/actions/auth";
import { initialActionState } from "@/actions/types";

export default function ConnexionPage() {
  const [state, formAction, pending] = useActionState(login, initialActionState);

  return (
    <div className="page-head">
      <div className="wrap" style={{ maxWidth: 480 }}>
        <div className="crumb">
          <Link href="/">Accueil</Link> · Connexion
        </div>
        <h1 style={{ fontSize: 30, marginBottom: 24 }}>Connexion</h1>

        <form action={formAction} className="form-card" aria-label="Formulaire de connexion">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input type="password" id="password" name="password" required />
            <p className="hint" style={{ textAlign: "right", marginTop: 4 }}>
              <Link href="/mot-de-passe-oublie" style={{ textDecoration: "underline" }}>
                Mot de passe oublié ?
              </Link>
            </p>
          </div>

          {state.error && <p className="form-error">{state.error}</p>}

          <button type="submit" className="btn btn-gold btn-lg" style={{ width: "100%", justifyContent: "center" }} disabled={pending}>
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="hint" style={{ marginTop: 16, textAlign: "center" }}>
          Pas encore de compte ?{" "}
          <Link href="/inscription" style={{ textDecoration: "underline" }}>
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
