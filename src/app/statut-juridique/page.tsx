import Link from "next/link";

export const metadata = { title: "Statut juridique — Kôrô" };

export default function StatutJuridiquePage() {
  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <div className="crumb">
            <Link href="/">Accueil</Link> · Statut juridique
          </div>
          <h1>Statut juridique de Kôrô</h1>
          <p>Kôrô n&apos;est pas une agence d&apos;intérim. Voici comment la plateforme se positionne.</p>
        </div>
      </div>

      <section>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <div className="status-banner" style={{ marginBottom: 40 }}>
            <span className="status-dot"></span>
            <div>
              <strong>Document provisoire</strong>
              <span className="sub">
                À valider avec un juriste malien avant lancement commercial — le régime du travail
                temporaire classique nécessite un agrément ministériel au Mali, à clarifier selon le
                positionnement exact retenu.
              </span>
            </div>
          </div>

          <div className="info-grid" style={{ marginBottom: 32 }}>
            <div className="info-item">
              <div className="k">Ce que Kôrô est</div>
              <div className="v">Un intermédiaire technique de mise en relation et de paiement sécurisé</div>
            </div>
            <div className="info-item">
              <div className="k">Ce que Kôrô n&apos;est pas</div>
              <div className="v">Une agence d&apos;intérim ni un employeur au sens du droit du travail</div>
            </div>
            <div className="info-item">
              <div className="k">Gestion de la paie</div>
              <div className="v">Aucune — le montant versé est un règlement de mission, pas un salaire</div>
            </div>
            <div className="info-item">
              <div className="k">Zone d&apos;activité</div>
              <div className="v">Mali au lancement, extension pays par pays ensuite</div>
            </div>
          </div>

          <p style={{ opacity: 0.75, fontSize: 15, lineHeight: 1.65 }}>
            Cette page sera complétée avec les références légales exactes (statut de
            l&apos;entreprise, immatriculation, cadre réglementaire malien applicable au courtage
            numérique) une fois validées avec un juriste local.
          </p>
        </div>
      </section>
    </>
  );
}
