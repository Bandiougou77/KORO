"use client";

import { useActionState, useState } from "react";
import { createMission } from "@/actions/missions";
import { initialActionState } from "@/actions/types";
import { calculerRepartition } from "@/lib/repartition";
import { formatMontant, uniteFromTypeTarif } from "@/lib/currency";
import { TAUX_COMMISSION_AFFICHAGE } from "@/lib/commissionConfig";

export function PublierForm({ nomEntreprise }: { nomEntreprise: string }) {
  const [state, formAction, pending] = useActionState(createMission, initialActionState);

  const [titre, setTitre] = useState("Préparateur de commandes");
  const [montant, setMontant] = useState(1200);
  const [typeTarif, setTypeTarif] = useState<"horaire" | "forfait" | "mensuel">("horaire");
  const [dureeType, setDureeType] = useState<"courte" | "longue">("courte");
  const devise = "FCFA" as const;
  const [mode, setMode] = useState<"sur_site" | "distance" | "les_deux">("sur_site");

  const { commission, frais, totalEntreprise } = calculerRepartition(montant, TAUX_COMMISSION_AFFICHAGE);
  const unite = uniteFromTypeTarif(typeTarif);

  const initials = nomEntreprise
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="form-shell">
      <form action={formAction} className="form-card" aria-label="Formulaire de publication de mission">
        <fieldset>
          <legend>1 · La mission</legend>
          <div className="field">
            <label htmlFor="titre">Intitulé du poste</label>
            <input
              type="text"
              id="titre"
              name="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex. Préparateur de commandes"
              required
            />
            <p className="hint">Soyez précis : c&apos;est le premier élément que verra un candidat dans le fil.</p>
          </div>
          <div className="field">
            <label htmlFor="description">Description de la mission</label>
            <textarea
              id="description"
              name="description"
              placeholder="Ce que la personne fera concrètement, le rythme, le matériel fourni..."
              required
            />
          </div>
          <div className="field">
            <label htmlFor="lieu">Lieu</label>
            <input type="text" id="lieu" name="lieu" placeholder="Ex. Hamdallaye, Bamako, ou télétravail" />
          </div>
        </fieldset>

        <fieldset>
          <legend>2 · Modalités</legend>
          <div className="field">
            <label>Où se déroule la mission ?</label>
            <div className="radio-group" role="radiogroup" aria-label="Mode de la mission">
              <label className="radio-opt">
                <input type="radio" name="mode" value="sur_site" checked={mode === "sur_site"} onChange={() => setMode("sur_site")} /> Sur site
              </label>
              <label className="radio-opt">
                <input type="radio" name="mode" value="distance" checked={mode === "distance"} onChange={() => setMode("distance")} /> À distance
              </label>
              <label className="radio-opt">
                <input type="radio" name="mode" value="les_deux" checked={mode === "les_deux"} onChange={() => setMode("les_deux")} /> Les deux
              </label>
            </div>
          </div>
          <div className="field">
            <label>Durée de la mission</label>
            <div className="radio-group" role="radiogroup" aria-label="Durée de la mission">
              <label className="radio-opt">
                <input type="radio" name="dureeType" value="courte" checked={dureeType === "courte"} onChange={() => setDureeType("courte")} /> Courte
                (moins de 3 mois)
              </label>
              <label className="radio-opt">
                <input type="radio" name="dureeType" value="longue" checked={dureeType === "longue"} onChange={() => setDureeType("longue")} /> Longue
                (3 mois et plus)
              </label>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="dateDebut">Date de début souhaitée</label>
              <input type="date" id="dateDebut" name="dateDebut" />
            </div>
            <div className="field">
              <label htmlFor="dateFin">Date de fin (si connue)</label>
              <input type="date" id="dateFin" name="dateFin" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>3 · Rémunération</legend>
          <div className="field">
            <label htmlFor="typeTarif">Type de tarif</label>
            <select
              id="typeTarif"
              name="typeTarif"
              value={typeTarif}
              onChange={(e) => setTypeTarif(e.target.value as typeof typeTarif)}
            >
              <option value="horaire">Taux horaire</option>
              <option value="forfait">Forfait pour la mission</option>
              <option value="mensuel">Mensuel</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="montantBrut">Montant proposé (FCFA)</label>
            <input
              type="number"
              id="montantBrut"
              name="montantBrut"
              value={montant}
              step="10"
              min="0"
              onChange={(e) => setMontant(parseFloat(e.target.value) || 0)}
              required
            />
            <p className="hint">C&apos;est le montant que recevra le candidat, en intégralité. La commission et les frais de paiement s&apos;ajoutent par-dessus pour votre paiement total — voir l&apos;aperçu.</p>
          </div>
        </fieldset>

        {state.error && <p className="form-error">{state.error}</p>}

        <button type="submit" className="btn btn-gold btn-lg" style={{ width: "100%", justifyContent: "center" }} disabled={pending}>
          {pending ? "Publication…" : "Publier l'annonce"}
        </button>
        <p className="hint" style={{ textAlign: "center", marginTop: 14 }}>
          En publiant, vous acceptez que la commission Kôrô soit prélevée uniquement si une candidature est confirmée.
        </p>
      </form>

      <aside className="sticky-preview">
        <div className="preview-card">
          <div className="preview-tag">Aperçu de l&apos;annonce</div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
            <div className="job-logo">{initials || "?"}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{titre || "Intitulé du poste"}</div>
              <div style={{ fontSize: 13, opacity: 0.6 }}>{nomEntreprise}</div>
            </div>
          </div>
          <div className="job-badges">
            <span className="badge">{mode === "sur_site" ? "Sur site" : mode === "distance" ? "À distance" : "Sur site / distance"}</span>
            <span className="badge">{dureeType === "courte" ? "Court terme" : "Long terme"}</span>
          </div>
          <div className="preview-est">
            <div className="row">
              <span>Montant proposé au candidat</span>
              <span className="mono">{formatMontant(montant, devise, unite)}</span>
            </div>
            <div className="row">
              <span>Commission Kôrô ({TAUX_COMMISSION_AFFICHAGE}%)</span>
              <span className="mono">+ {formatMontant(commission, devise)}</span>
            </div>
            <div className="row">
              <span>Frais de paiement (0,6%)</span>
              <span className="mono">+ {formatMontant(frais, devise)}</span>
            </div>
            <div className="row total">
              <span>Total que vous payez</span>
              <span className="mono">{formatMontant(totalEntreprise, devise, unite)}</span>
            </div>
          </div>
        </div>

        <div className="help-box">
          <strong style={{ display: "block", marginBottom: 6, opacity: 1 }}>Besoin d&apos;aide pour remplir ?</strong>
          Un intitulé clair et un tarif réaliste multiplient par trois le nombre de candidatures reçues en moyenne.
        </div>
      </aside>
    </div>
  );
}
