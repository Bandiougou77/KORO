"use client";

import { useState } from "react";
import { calculerRepartition } from "@/lib/repartition";
import { formatMontant } from "@/lib/currency";
import { TAUX_COMMISSION_AFFICHAGE } from "@/lib/commissionConfig";

const fmt = (n: number) => formatMontant(n, "FCFA");

export function CommissionSimulator() {
  const [montant, setMontant] = useState(50000);

  const { commission, frais, totalEntreprise } = calculerRepartition(montant, TAUX_COMMISSION_AFFICHAGE);

  return (
    <div className="commission" style={{ marginBottom: 80 }}>
      <div>
        <div className="field" style={{ maxWidth: 320 }}>
          <label htmlFor="sim-montant">Montant proposé au candidat (FCFA)</label>
          <input
            type="number"
            id="sim-montant"
            value={montant}
            step={100}
            min={0}
            onChange={(e) => setMontant(parseFloat(e.target.value) || 0)}
          />
        </div>
        <p style={{ fontSize: 14, opacity: 0.65, lineHeight: 1.6, marginTop: 20 }}>
          Le montant que vous saisissez est toujours celui que reçoit intégralement le candidat.
          La commission Kôrô et les frais de paiement sécurisé s&apos;ajoutent par-dessus, à la
          charge de l&apos;entreprise.
        </p>
      </div>
      <div className="calc-card">
        <div className="pipe-tag" style={{ marginBottom: 18 }}>
          Répartition
        </div>
        <div className="calc-row">
          <span>Reçu par le candidat</span>
          <span className="val">{fmt(montant)}</span>
        </div>
        <div className="calc-row">
          <span>Commission Kôrô ({TAUX_COMMISSION_AFFICHAGE}%)</span>
          <span className="val">+ {fmt(commission)}</span>
        </div>
        <div className="calc-row">
          <span>Frais de paiement sécurisé (0,6%)</span>
          <span className="val">+ {fmt(frais)}</span>
        </div>
        <div className="calc-row total">
          <span>Payé par l&apos;entreprise</span>
          <span className="val">{fmt(totalEntreprise)}</span>
        </div>
      </div>
    </div>
  );
}
