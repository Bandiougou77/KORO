import Link from "next/link";

export const metadata = { title: "Devenir partenaire — Kôrô" };

export default function DevenirPartenairePage() {
  return (
    <div className="page-head">
      <div className="wrap" style={{ maxWidth: 640 }}>
        <div className="crumb">
          <Link href="/">Accueil</Link> · Devenir partenaire
        </div>
        <h1>Kôrô arrive bientôt dans toute l&apos;Afrique de l&apos;Ouest</h1>
        <p>
          Le lancement se fait pays par pays, en commençant par le Mali. Chaque nouveau pays
          s&apos;ouvre avec un relais local de confiance — quelqu&apos;un capable de démarcher des
          entreprises et d&apos;accompagner les premiers candidats sur le terrain.
        </p>
        <p style={{ marginTop: 16, opacity: 0.75, fontSize: 15.5, lineHeight: 1.6 }}>
          Vous connaissez bien un marché de l&apos;emploi local en Afrique de l&apos;Ouest et voulez
          être ce relais dans votre pays ? Écrivez-nous.
        </p>

        <div style={{ marginTop: 24 }}>
          <a href="mailto:partenaires@koro.app" className="btn btn-gold btn-lg">
            Nous contacter
          </a>
        </div>
      </div>
    </div>
  );
}
