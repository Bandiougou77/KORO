"use client";

import { useState } from "react";
import { calculerRepartition } from "@/lib/repartition";
import { formatMontant } from "@/lib/currency";

const fmt = (n: number) => formatMontant(n, "FCFA");

export function CommissionSimulator() {
  const [montant, setMontant] = useState(50000);
  const [taux, setTaux] = useState(6);

  const { commission, frais, net } = calculerRepartition(montant, taux);

  return (
    <div className="commission" style={{ marginBottom: 80 }}>
      <div>
        <div className="field" style={{ maxWidth: 320 }}>
          <label htmlFor="sim-montant">Montant de la mission (FCFA)</label>
          <input
            type="number"
            id="sim-montant"
            value={montant}
            step={100}
            min={0}
            onChange={(e) => setMontant(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="field" style={{ maxWidth: 320 }}>
          <label htmlFor="sim-duree">Durée de la mission</label>
          <select id="sim-duree" value={taux} onChange={(e) => setTaux(parseFloat(e.target.value))}>
            <option value={6}>Courte — moins de 3 mois (6%)</option>
            <option value={5}>Longue — 3 mois et plus (5%)</option>
          </select>
        </div>
        <p style={{ fontSize: 14, opacity: 0.65, lineHeight: 1.6, marginTop: 20 }}>
          Le montant que vous saisissez est toujours celui que l&apos;entreprise accepte de
          payer. Le candidat reçoit ce montant, moins la commission, moins de très légers frais
          de paiement sécurisé.
        </p>
      </div>
      <div className="calc-card">
        <div className="pipe-tag" style={{ marginBottom: 18 }}>
          Répartition
        </div>
        <div className="calc-row">
          <span>Payé par l&apos;entreprise</span>
          <span className="val">{fmt(montant)}</span>
        </div>
        <div className="calc-row">
          <span>Commission Kôrô ({taux}%)</span>
          <span className="val">− {fmt(commission)}</span>
        </div>
        <div className="calc-row">
          <span>Frais de paiement sécurisé (0,6%)</span>
          <span className="val">− {fmt(frais)}</span>
        </div>
        <div className="calc-row total">
          <span>Reçu par le candidat</span>
          <span className="val">{fmt(net)}</span>
        </div>
      </div>
    </div>
  );
}
