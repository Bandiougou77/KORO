import Link from "next/link";

export const metadata = { title: "Conditions d'utilisation — Kôrô" };

export default function ConditionsUtilisationPage() {
  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <div className="crumb">
            <Link href="/">Accueil</Link> · Conditions d&apos;utilisation
          </div>
          <h1>Conditions d&apos;utilisation</h1>
          <p>Le cadre dans lequel Kôrô met en relation entreprises et candidats au Mali.</p>
        </div>
      </div>

      <section>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <div className="status-banner" style={{ marginBottom: 40 }}>
            <span className="status-dot"></span>
            <div>
              <strong>Document provisoire</strong>
              <span className="sub">À valider avec un juriste local avant tout lancement commercial.</span>
            </div>
          </div>

          <div className="steps" style={{ gridTemplateColumns: "1fr", marginBottom: 0 }}>
            <div className="step">
              <h3>1. Kôrô est un intermédiaire, jamais l&apos;employeur</h3>
              <p>
                Kôrô met en relation des entreprises et des candidats pour des missions courtes ou
                longues. Kôrô ne devient à aucun moment l&apos;employeur du candidat : ni gestion de
                paie, ni cotisations sociales, ni lien de subordination. La mission se déroule
                directement entre l&apos;entreprise et le candidat.
              </p>
            </div>
            <div className="step">
              <h3>2. Aucune commission côté candidat</h3>
              <p>
                Le candidat ne paie jamais de frais d&apos;inscription, de dossier ou de
                commission. La commission de Kôrô est prélevée uniquement sur le montant réglé par
                l&apos;entreprise, au moment où une mission confirmée est payée.
              </p>
            </div>
            <div className="step">
              <h3>3. Zone géographique</h3>
              <p>
                Kôrô est disponible au Mali au lancement. L&apos;ouverture progressive à d&apos;autres
                pays d&apos;Afrique de l&apos;Ouest se fera pays par pays, avec des conditions
                d&apos;utilisation adaptées à chaque cadre légal local.
              </p>
            </div>
            <div className="step">
              <h3>4. Responsabilité</h3>
              <p>
                Kôrô sécurise la mise en relation et le paiement. Le déroulement de la mission
                elle-même (sécurité, conditions de travail, qualité du travail rendu) reste de la
                responsabilité de l&apos;entreprise et du candidat, comme pour toute prestation
                directe.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
