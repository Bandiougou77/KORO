"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerCandidat, registerEntreprise } from "@/actions/auth";
import { initialActionState } from "@/actions/types";

export default function InscriptionPage() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "entreprise" ? "entreprise" : "candidat";
  const [role, setRole] = useState<"candidat" | "entreprise">(initialRole);

  const [candidatState, candidatAction, candidatPending] = useActionState(
    registerCandidat,
    initialActionState,
  );
  const [entrepriseState, entrepriseAction, entreprisePending] = useActionState(
    registerEntreprise,
    initialActionState,
  );

  return (
    <div className="page-head">
      <div className="wrap" style={{ maxWidth: 560 }}>
        <div className="crumb">
          <Link href="/">Accueil</Link> · Inscription
        </div>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Créer un compte</h1>
        <p className="hint" style={{ marginBottom: 20 }}>
          Kôrô est disponible au Mali pour le moment — bientôt dans le reste de l&apos;Afrique de l&apos;Ouest.
        </p>

        <div className="track-toggle" role="tablist" aria-label="Type de compte" style={{ marginBottom: 24 }}>
          <button
            type="button"
            role="tab"
            aria-selected={role === "candidat"}
            className={role === "candidat" ? "active" : ""}
            onClick={() => setRole("candidat")}
          >
            Je cherche une mission
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === "entreprise"}
            className={role === "entreprise" ? "active" : ""}
            onClick={() => setRole("entreprise")}
          >
            Je propose une mission
          </button>
        </div>

        {role === "candidat" ? (
          <form action={candidatAction} className="form-card" aria-label="Inscription candidat">
            <fieldset>
              <legend>Votre profil</legend>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="prenom">Prénom</label>
                  <input type="text" id="prenom" name="prenom" required />
                </div>
                <div className="field">
                  <label htmlFor="nom">Nom</label>
                  <input type="text" id="nom" name="nom" required />
                </div>
              </div>
              <div className="field">
                <label htmlFor="disponibilite">Disponibilité</label>
                <select id="disponibilite" name="disponibilite" defaultValue="les_deux">
                  <option value="sur_site">Sur site</option>
                  <option value="distance">À distance</option>
                  <option value="les_deux">Les deux</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="localisation">Ville</label>
                <input type="text" id="localisation" name="localisation" placeholder="Ex. Bamako, Ségou..." />
              </div>
              <div className="field">
                <label htmlFor="competences">Compétences</label>
                <input type="text" id="competences" name="competences" placeholder="Ex. logistique, saisie, développement..." />
              </div>
            </fieldset>
            <fieldset>
              <legend>Recevoir vos paiements</legend>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="moyenPaiementPrefere">Moyen de paiement préféré</label>
                  <select id="moyenPaiementPrefere" name="moyenPaiementPrefere" defaultValue="orange_money">
                    <option value="orange_money">Orange Money</option>
                    <option value="wave">Wave</option>
                    <option value="moov_money">Moov Money</option>
                    <option value="virement">Virement bancaire</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="identifiantPaiement">Numéro / identifiant</label>
                  <input type="text" id="identifiantPaiement" name="identifiantPaiement" placeholder="Ex. +223 70 00 00 00" />
                </div>
              </div>
            </fieldset>
            <fieldset>
              <legend>Connexion</legend>
              <div className="field">
                <label htmlFor="c-email">Email</label>
                <input type="email" id="c-email" name="email" required />
              </div>
              <div className="field">
                <label htmlFor="c-telephone">Téléphone (optionnel)</label>
                <input type="tel" id="c-telephone" name="telephone" />
              </div>
              <div className="field">
                <label htmlFor="c-password">Mot de passe</label>
                <input type="password" id="c-password" name="password" minLength={8} required />
              </div>
            </fieldset>

            {candidatState.error && <p className="form-error">{candidatState.error}</p>}

            <button type="submit" className="btn btn-gold btn-lg" style={{ width: "100%", justifyContent: "center" }} disabled={candidatPending}>
              {candidatPending ? "Création…" : "Créer mon compte candidat"}
            </button>
          </form>
        ) : (
          <form action={entrepriseAction} className="form-card" aria-label="Inscription entreprise">
            <fieldset>
              <legend>Votre entreprise</legend>
              <div className="field">
                <label htmlFor="nomEntreprise">Nom de l&apos;entreprise</label>
                <input type="text" id="nomEntreprise" name="nomEntreprise" required />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="identifiantLegal">Identifiant légal (RCCM ou équivalent)</label>
                  <input type="text" id="identifiantLegal" name="identifiantLegal" />
                </div>
                <div className="field">
                  <label htmlFor="adresse">Adresse</label>
                  <input type="text" id="adresse" name="adresse" placeholder="Ex. Hamdallaye ACI 2000, Bamako" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="pieceIdentiteResponsable">Pièce d&apos;identité du responsable (numéro)</label>
                <input type="text" id="pieceIdentiteResponsable" name="pieceIdentiteResponsable" placeholder="Ex. numéro de CNI ou passeport" required />
                <p className="hint">Vérification obligatoire avant de pouvoir publier une mission — protège les candidats contre les faux comptes.</p>
              </div>
            </fieldset>
            <fieldset>
              <legend>Connexion</legend>
              <div className="field">
                <label htmlFor="e-email">Email</label>
                <input type="email" id="e-email" name="email" required />
              </div>
              <div className="field">
                <label htmlFor="e-telephone">Téléphone (optionnel)</label>
                <input type="tel" id="e-telephone" name="telephone" />
              </div>
              <div className="field">
                <label htmlFor="e-password">Mot de passe</label>
                <input type="password" id="e-password" name="password" minLength={8} required />
              </div>
            </fieldset>

            {entrepriseState.error && <p className="form-error">{entrepriseState.error}</p>}

            <button type="submit" className="btn btn-gold btn-lg" style={{ width: "100%", justifyContent: "center" }} disabled={entreprisePending}>
              {entreprisePending ? "Création…" : "Créer mon compte entreprise"}
            </button>
          </form>
        )}

        <p className="hint" style={{ marginTop: 16, textAlign: "center" }}>
          Déjà un compte ?{" "}
          <Link href="/connexion" style={{ textDecoration: "underline" }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
