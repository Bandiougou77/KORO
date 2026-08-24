import Link from "next/link";

export const metadata = { title: "Comment ça marche — Kôrô" };

export default function CommentCaMarchePage() {
  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <div className="crumb">
            <Link href="/">Accueil</Link> · Comment ça marche
          </div>
          <h1>Comment ça marche, du dépôt d&apos;une mission à son paiement</h1>
          <p>
            Deux parcours, expliqués simplement : celui d&apos;une entreprise qui propose une
            mission, et celui d&apos;une personne qui la trouve et l&apos;accepte. Choisissez
            votre côté ci-dessous.
          </p>
          <div className="track-toggle" role="tablist" aria-label="Choisir un parcours" style={{ marginTop: 24 }}>
            <a href="#candidat" role="tab" aria-selected="true" className="active">
              Je cherche une mission
            </a>
            <a href="#entreprise" role="tab" aria-selected="false">
              Je propose une mission
            </a>
          </div>
        </div>
      </div>

      <section id="candidat">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Côté candidat</div>
            <h2>Trouver et accepter une mission</h2>
            <p>
              Aucun frais pour vous à aucune étape. Kôrô se rémunère uniquement sur la part
              versée par l&apos;entreprise.
            </p>
          </div>

          <div className="timeline">
            <div className="tl-item">
              <div className="tl-num">1</div>
              <div className="tl-body">
                <h3>Créez un profil simple</h3>
                <p>
                  Nom, coordonnées, ce que vous savez faire, où vous êtes disponible (sur place,
                  à distance, ou les deux). Deux minutes suffisent, pas de CV obligatoire pour
                  commencer.
                </p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-num">2</div>
              <div className="tl-body">
                <h3>Parcourez les annonces et filtrez</h3>
                <p>
                  Toutes les offres publiées par les entreprises sont visibles dans le fil, avec
                  le tarif affiché avant même de cliquer. Filtrez par durée (courte ou longue) et
                  par lieu (sur site ou à distance).
                </p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-num">3</div>
              <div className="tl-body">
                <h3>Postulez en un clic</h3>
                <p>
                  Sur la fiche de l&apos;offre, un bouton &quot;Je postule&quot; envoie votre
                  profil directement à l&apos;entreprise. Vous pouvez ajouter un message court si
                  vous voulez vous présenter.
                </p>
                <span className="tl-note">
                  Vous voyez toujours le montant net que vous recevrez, avant de postuler.
                </span>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-num">4</div>
              <div className="tl-body">
                <h3>L&apos;entreprise vous répond</h3>
                <p>
                  Elle accepte ou décline votre candidature directement depuis son espace. Si
                  elle accepte, vous recevez une notification avec les détails précis de la
                  mission (date, lieu ou lien à distance, personne à contacter).
                </p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-num">5</div>
              <div className="tl-body">
                <h3>Vous effectuez la mission</h3>
                <p>
                  Vous travaillez comme convenu avec l&apos;entreprise. Kôrô n&apos;intervient
                  pas dans l&apos;organisation du travail lui-même — seulement dans la mise en
                  relation et le paiement.
                </p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-num">6</div>
              <div className="tl-body">
                <h3>Vous êtes payé automatiquement</h3>
                <p>
                  L&apos;entreprise règle le montant convenu à Kôrô, qui reverse votre part sous
                  48h sur le compte que vous avez renseigné. La commission a déjà été retirée —
                  le montant que vous recevez est celui qui vous a été annoncé, sans surprise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="entreprise" style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow" style={{ color: "var(--gold-soft)", opacity: 1 }}>
              Côté entreprise
            </div>
            <h2>Publier une mission et recruter</h2>
            <p style={{ opacity: 0.65 }}>
              Aucun abonnement à payer pour publier. La commission n&apos;est prélevée que si une
              mission est réellement confirmée.
            </p>
          </div>

          <div className="timeline">
            <div className="tl-item">
              <div className="tl-num" style={{ background: "var(--gold)", color: "var(--ink)" }}>
                1
              </div>
              <div className="tl-body">
                <h3 style={{ color: "var(--paper)" }}>Décrivez votre besoin</h3>
                <p style={{ opacity: 0.65 }}>
                  Poste, durée (courte ou longue), lieu ou télétravail, tarif que vous proposez.
                  Le formulaire vous montre en direct ce que le candidat verra et ce que vous
                  paierez au total.
                </p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-num" style={{ background: "var(--gold)", color: "var(--ink)" }}>
                2
              </div>
              <div className="tl-body">
                <h3 style={{ color: "var(--paper)" }}>Votre annonce est publiée immédiatement</h3>
                <p style={{ opacity: 0.65 }}>
                  Pas de validation manuelle qui bloque plusieurs jours : votre offre apparaît
                  dans le fil dès que vous la publiez.
                </p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-num" style={{ background: "var(--gold)", color: "var(--ink)" }}>
                3
              </div>
              <div className="tl-body">
                <h3 style={{ color: "var(--paper)" }}>Vous recevez les candidatures</h3>
                <p style={{ opacity: 0.65 }}>
                  Chaque candidature arrive dans votre espace avec le profil de la personne. Vous
                  pouvez accepter, décliner, ou lui écrire directement pour préciser un point.
                </p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-num" style={{ background: "var(--gold)", color: "var(--ink)" }}>
                4
              </div>
              <div className="tl-body">
                <h3 style={{ color: "var(--paper)" }}>Vous confirmez la mission</h3>
                <p style={{ opacity: 0.65 }}>
                  En acceptant une candidature, vous confirmez la mission. C&apos;est ce moment
                  précis qui déclenche la facturation — jamais avant.
                </p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-num" style={{ background: "var(--gold)", color: "var(--ink)" }}>
                5
              </div>
              <div className="tl-body">
                <h3 style={{ color: "var(--paper)" }}>Vous réglez le montant convenu</h3>
                <p style={{ opacity: 0.65 }}>
                  Le paiement se fait en ligne, en toute sécurité, directement sur Kôrô. Vous
                  payez le montant affiché dès le départ, commission comprise — aucun frais caché
                  ne s&apos;ajoute après coup.
                </p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-num" style={{ background: "var(--gold)", color: "var(--ink)" }}>
                6
              </div>
              <div className="tl-body">
                <h3 style={{ color: "var(--paper)" }}>Kôrô reverse le candidat</h3>
                <p style={{ opacity: 0.65 }}>
                  Nous nous chargeons de reverser sa part au candidat sous 48h. Vous n&apos;avez
                  ni fiche de paie ni charges sociales à gérer : vous restez un client du
                  service, pas l&apos;employeur.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <Link href="/publier" className="btn btn-gold btn-lg">
              Publier ma première mission
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Questions fréquentes</div>
            <h2>Ce qu&apos;on nous demande le plus souvent</h2>
          </div>
          <div className="steps">
            <div className="step">
              <h3>Est-ce que je peux refuser une mission déjà acceptée ?</h3>
              <p>
                Oui, tant que le paiement n&apos;a pas été effectué. Une fois la mission payée,
                elle est considérée comme confirmée des deux côtés.
              </p>
            </div>
            <div className="step">
              <h3>Comment la commission est-elle calculée ?</h3>
              <p>
                Un pourcentage fixe du montant que l&apos;entreprise paie, affiché avant toute
                candidature. Voir le détail sur la page Commission.
              </p>
            </div>
            <div className="step">
              <h3>Qui est responsable si la mission ne se passe pas bien ?</h3>
              <p>
                Kôrô met en relation et sécurise le paiement, mais n&apos;est pas l&apos;employeur
                : le cadre de la mission (sécurité, conditions) reste entre l&apos;entreprise et
                le candidat, comme pour toute prestation directe.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
