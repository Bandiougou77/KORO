import Link from "next/link";
import { db } from "@/lib/db";
import { JobCard } from "@/components/JobCard";

export default async function HomePage() {
  const missions = await db.mission.findMany({
    where: { statut: "publiee" },
    include: {
      entreprise: { include: { _count: { select: { missions: { where: { statut: "payee" } } } } } },
    },
    orderBy: { dateCreation: "desc" },
    take: 4,
  });

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">Kôrô, &quot;le lien&quot; en mandingue · Bamako, Mali — bientôt dans toute l&apos;Afrique de l&apos;Ouest</div>
            <h1>
              Trouve une mission.
              <br />
              <em>Sans agence entre les deux.</em>
            </h1>
            <p className="lead">
              Kôrô connecte directement les entreprises qui recrutent et les personnes qui
              cherchent une mission — courte, longue, sur site ou à distance. Pas de dossier qui
              traîne, pas d&apos;intermédiaire lourd : l&apos;offre, le contact, la mission.
            </p>
            <div className="hero-actions">
              <Link href="/offres" className="btn btn-gold btn-lg">
                Voir les annonces
              </Link>
              <Link href="/publier" className="btn btn-ghost btn-lg" style={{ borderColor: "var(--line-dark)" }}>
                Publier une offre →
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="num mono">6%</div>
                <div className="label">commission moyenne</div>
              </div>
              <div className="stat">
                <div className="num mono">48h</div>
                <div className="label">délai moyen de mise en relation</div>
              </div>
              <div className="stat">
                <div className="num mono">0 FCFA</div>
                <div className="label">frais côté candidat</div>
              </div>
            </div>
          </div>

          <div className="pipeline">
            <div className="flow-line l1"></div>
            <div className="flow-line l2"></div>

            <div className="pipe-col company">
              <div className="pipe-tag">Entreprise</div>
              <div className="pipe-title">Atelier Bozola — Logistique</div>
              <div className="pipe-meta">Mission courte · Bamako</div>
              <div className="pipe-row">
                <span className="pipe-meta mono">2 500 FCFA/h proposé</span>
                <span className="pipe-chip">Publié</span>
              </div>
            </div>

            <div className="flow-node">
              <div className="pct mono">6%</div>
              <div className="pct-label">retenu</div>
            </div>

            <div className="pipe-col worker">
              <div className="pipe-tag">Candidat</div>
              <div className="pipe-title">Mission acceptée</div>
              <div className="pipe-meta">2 335 FCFA/h reçu · viré sous 48h</div>
              <div className="pipe-row">
                <span className="pipe-meta mono">2 500 FCFA brut</span>
                <span className="pipe-chip" style={{ background: "var(--ink)", color: "var(--paper)" }}>
                  Payé
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="feed-section" id="feed">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">En ce moment</div>
            <h2>Les annonces arrivent en direct des entreprises.</h2>
            <p>
              Chaque offre vient d&apos;une entreprise vérifiée. Tu vois le taux horaire ou le
              forfait avant de postuler — la commission de Kôrô est toujours affichée, jamais
              cachée.
            </p>
          </div>

          <div className="job-list">
            {missions.map((mission) => (
              <JobCard key={mission.id} mission={mission} />
            ))}
            {missions.length === 0 && (
              <p style={{ opacity: 0.6, padding: "24px 0" }}>Aucune mission publiée pour le moment.</p>
            )}
          </div>
        </div>
      </section>

      <section id="comment">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Le principe</div>
            <h2>Trois étapes, aucune agence entre les deux.</h2>
            <p>
              Kôrô n&apos;emploie personne. La plateforme met en relation, sécurise le paiement,
              et prend sa part uniquement quand la mission est confirmée.
            </p>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">01</span>
              <h3>L&apos;entreprise publie</h3>
              <p>
                Elle décrit la mission, le lieu ou le télétravail, la durée et le tarif proposé.
                L&apos;annonce est visible immédiatement dans le fil.
              </p>
            </div>
            <div className="step">
              <span className="step-num">02</span>
              <h3>Le candidat postule</h3>
              <p>
                Profil, dispo, et message direct à l&apos;entreprise. Pas de dossier à monter, pas
                d&apos;attente de traitement administratif.
              </p>
            </div>
            <div className="step">
              <span className="step-num">03</span>
              <h3>La mission se paie via Kôrô</h3>
              <p>
                L&apos;entreprise règle le montant convenu. La commission est prélevée
                automatiquement, le reste est versé au candidat sous 48h.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="commission">
        <div className="wrap">
          <div className="commission">
            <div>
              <div className="eyebrow">Transparence</div>
              <h2 style={{ fontSize: 30, fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
                La commission est affichée avant que quiconque signe quoi que ce soit.
              </h2>
              <p style={{ opacity: 0.72, fontSize: 15.5, lineHeight: 1.6 }}>
                Contrairement à une agence d&apos;intérim classique, Kôrô ne devient jamais
                l&apos;employeur : pas de gestion de paie, pas de garantie financière à
                constituer, pas de statut de &quot;loueur de main-d&apos;œuvre&quot;. La
                plateforme facture uniquement sa mise en relation et son service de paiement
                sécurisé — un pourcentage prélevé sur le montant versé par l&apos;entreprise.
              </p>
            </div>
            <div className="calc-card">
              <div className="pipe-tag" style={{ marginBottom: 18 }}>
                Exemple de mission
              </div>
              <div className="calc-row">
                <span>Montant proposé par l&apos;entreprise</span>
                <span className="val">50 000 FCFA</span>
              </div>
              <div className="calc-row">
                <span>Commission Kôrô (6%)</span>
                <span className="val">− 3 000 FCFA</span>
              </div>
              <div className="calc-row">
                <span>Frais de paiement sécurisé</span>
                <span className="val">− 300 FCFA</span>
              </div>
              <div className="calc-row total">
                <span>Versé au candidat</span>
                <span className="val">46 700 FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="wrap">
          <h2>Une mission t&apos;attend peut-être déjà dans le fil.</h2>
          <p>Inscription gratuite, aucune commission côté candidat.</p>
          <div className="final-actions">
            <Link href="/offres" className="btn btn-dark btn-lg">
              Parcourir les annonces
            </Link>
            <Link href="/inscription?role=entreprise" className="btn btn-ghost btn-lg" style={{ borderColor: "var(--line-dark)" }}>
              Créer un compte entreprise
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
