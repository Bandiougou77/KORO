import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getApercuRevenus } from "@/lib/revenus";
import { formatMontant } from "@/lib/currency";
import { TransfererForm } from "./TransfererForm";

export const metadata = { title: "Mes revenus — Kôrô" };

export default async function RevenusPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/connexion?redirect=/admin/revenus");

  const apercu = await getApercuRevenus();

  const comptes = await db.compteBancaireAdmin.findMany();
  const virements = await db.virementCommission.findMany({
    include: { compteBancaire: true, pays: true },
    orderBy: { dateDemande: "desc" },
  });
  const paiements = await db.paiement.findMany({
    where: { statut: "effectue" },
    include: { mission: { include: { entreprise: true } } },
    orderBy: { datePaiement: "desc" },
  });

  return (
    <div className="page-head">
      <div className="wrap">
        <div className="crumb">
          <Link href="/">Accueil</Link> · Mes revenus
        </div>
        <h1>Mes revenus</h1>
        <p>Commission réellement perçue par Kôrô, distincte du volume total des missions payées.</p>
      </div>

      <section style={{ paddingTop: 36 }}>
        <div className="wrap">
          {apercu.length === 0 ? (
            <p style={{ opacity: 0.6 }}>Aucune commission perçue pour le moment.</p>
          ) : (
            apercu.map((ligne) => {
              const compte = comptes.find((c) => c.paysId === ligne.paysId);
              return (
                <div key={ligne.paysId} className="calc-card" style={{ marginBottom: 32 }}>
                  <div className="pipe-tag" style={{ marginBottom: 18 }}>
                    {ligne.paysNom}
                  </div>
                  <div className="calc-row">
                    <span>Volume total des missions payées (GMV)</span>
                    <span className="val">{formatMontant(ligne.gmv, ligne.devise)}</span>
                  </div>
                  <div className="calc-row">
                    <span>Commission collectée</span>
                    <span className="val">{formatMontant(ligne.commissionCollectee, ligne.devise)}</span>
                  </div>
                  <div className="calc-row">
                    <span>Déjà transférée</span>
                    <span className="val">{formatMontant(ligne.commissionVirée, ligne.devise)}</span>
                  </div>
                  <div className="calc-row total">
                    <span>Commission disponible</span>
                    <span className="val">{formatMontant(ligne.commissionDisponible, ligne.devise)}</span>
                  </div>

                  {compte ? (
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
                      <p className="hint" style={{ marginBottom: 10 }}>
                        Vers {compte.nomTitulaire} — {compte.ibanOuEquivalent}
                      </p>
                      <TransfererForm
                        paysId={ligne.paysId}
                        compteBancaireId={compte.id}
                        montantDisponible={ligne.commissionDisponible}
                      />
                    </div>
                  ) : (
                    <p className="hint" style={{ marginTop: 16 }}>
                      Aucun compte bancaire enregistré pour ce pays.
                    </p>
                  )}
                </div>
              );
            })
          )}

          <div className="section-head">
            <h2 style={{ fontSize: 22 }}>Historique des commissions par mission</h2>
          </div>
          {paiements.length === 0 ? (
            <p style={{ opacity: 0.6, marginBottom: 40 }}>Aucune mission payée pour le moment.</p>
          ) : (
            <div className="job-list" style={{ marginBottom: 40 }}>
              {paiements.map((p) => (
                <div key={p.id} className="job-card">
                  <div className="job-logo">{p.mission.entreprise.nomEntreprise.slice(0, 2).toUpperCase()}</div>
                  <div className="job-main">
                    <div className="job-title">{p.mission.titre}</div>
                    <div className="job-sub">
                      {p.mission.entreprise.nomEntreprise} ·{" "}
                      {p.datePaiement ? new Date(p.datePaiement).toLocaleDateString("fr-FR") : ""}
                    </div>
                  </div>
                  <div className="job-pay">
                    <div className="amount mono">{formatMontant(p.commission, p.devise)}</div>
                    <div className="fee">commission</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="section-head">
            <h2 style={{ fontSize: 22 }}>Virements effectués</h2>
          </div>
          {virements.length === 0 ? (
            <p style={{ opacity: 0.6 }}>Aucun virement pour le moment.</p>
          ) : (
            <div className="job-list">
              {virements.map((v) => (
                <div key={v.id} className="job-card">
                  <div className="job-logo">{v.compteBancaire.nomTitulaire.slice(0, 2).toUpperCase()}</div>
                  <div className="job-main">
                    <div className="job-title">{v.compteBancaire.nomTitulaire}</div>
                    <div className="job-sub">
                      {v.pays.nom} · {v.statut === "recu" ? "Reçu" : v.statut === "en_cours" ? "En cours" : "Échoué"} ·{" "}
                      {new Date(v.dateDemande).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="job-pay">
                    <div className="amount mono">{formatMontant(v.montant, v.devise)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
