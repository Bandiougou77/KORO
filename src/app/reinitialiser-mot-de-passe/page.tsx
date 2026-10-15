"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetMotDePasse } from "@/actions/auth";
import { initialActionState } from "@/actions/types";

export default function ReinitialiserMotDePassePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, formAction, pending] = useActionState(resetMotDePasse, initialActionState);

  if (!token) {
    return (
      <div className="page-head">
        <div className="wrap" style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: 30, marginBottom: 16 }}>Lien invalide</h1>
          <p className="form-error">
            Ce lien de réinitialisation est incomplet. Demandez-en un nouveau depuis{" "}
            <Link href="/mot-de-passe-oublie" style={{ textDecoration: "underline" }}>
              cette page
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-head">
      <div className="wrap" style={{ maxWidth: 480 }}>
        <div className="crumb">
          <Link href="/">Accueil</Link> · Nouveau mot de passe
        </div>
        <h1 style={{ fontSize: 30, marginBottom: 24 }}>Choisir un nouveau mot de passe</h1>

        <form action={formAction} className="form-card" aria-label="Réinitialisation du mot de passe">
          <input type="hidden" name="token" value={token} />
          <div className="field">
            <label htmlFor="password">Nouveau mot de passe</label>
            <input type="password" id="password" name="password" minLength={8} required />
          </div>

          {state.error && <p className="form-error">{state.error}</p>}

          <button
            type="submit"
            className="btn btn-gold btn-lg"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={pending}
          >
            {pending ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
