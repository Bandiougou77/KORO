import Link from "next/link";
import { CommissionSimulator } from "./CommissionSimulator";
import { TAUX_COMMISSION_AFFICHAGE } from "@/lib/commissionConfig";

export const metadata = { title: "Commission — Kôrô" };

export default function CommissionPage() {
  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <div className="crumb">
            <Link href="/">Accueil</Link> · Commission
          </div>
          <h1>Comment Kôrô prend sa part</h1>
          <p>
            Une seule règle : la commission n&apos;est jamais cachée, et elle n&apos;est jamais
            prélevée deux fois. Voici exactement quand, combien, et sur quel montant.
          </p>
        </div>
      </div>

      <section>
        <div className="wrap">
          <div className="steps" style={{ marginBottom: 70 }}>
            <div className="step">
              <span className="step-num">Qui paie ?</span>
              <h3>L&apos;entreprise, jamais le candidat</h3>
              <p>
                La commission s&apos;ajoute par-dessus le montant convenu avec le candidat. Il
                reçoit toujours l&apos;intégralité de ce montant : ni frais d&apos;inscription, ni
                frais de dossier, ni commission sur ce qu&apos;il touche.
              </p>
            </div>
            <div className="step">
              <span className="step-num">Combien ?</span>
              <h3>{TAUX_COMMISSION_AFFICHAGE}% du montant de la mission</h3>
              <p>
                Un taux unique, quelle que soit la durée de la mission. Le montant exact est
                toujours affiché avant publication et avant confirmation du paiement.
              </p>
            </div>
            <div className="step">
              <span className="step-num">Quand ?</span>
              <h3>Uniquement si la mission est confirmée</h3>
              <p>
                Publier une offre est gratuit. Postuler est gratuit. La commission n&apos;est
                prélevée qu&apos;au moment où l&apos;entreprise règle une mission réellement
                acceptée par un candidat.
              </p>
            </div>
          </div>

          <div className="section-head">
            <div className="eyebrow">Simulez</div>
            <h2>Calculez ce que vous paierez ou recevrez</h2>
            <p>Entrez un montant pour voir la répartition exacte, des deux côtés.</p>
          </div>

          <CommissionSimulator />

          <div className="section-head">
            <div className="eyebrow">Pourquoi ce modèle</div>
            <h2>Ce que la commission couvre</h2>
          </div>
          <div className="info-grid" style={{ marginBottom: 40 }}>
            <div className="info-item">
              <div className="k">Mise en relation</div>
              <div className="v">Diffusion de l&apos;offre et réception des candidatures qualifiées</div>
            </div>
            <div className="info-item">
              <div className="k">Paiement sécurisé</div>
              <div className="v">Versement encadré, sans que le candidat ait à relancer l&apos;entreprise</div>
            </div>
            <div className="info-item">
              <div className="k">Support</div>
              <div className="v">Un contact en cas de litige sur une mission</div>
            </div>
            <div className="info-item">
              <div className="k">Aucun frais caché</div>
              <div className="v">Pas d&apos;abonnement, pas de frais de dossier, pas de coût de publication</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
