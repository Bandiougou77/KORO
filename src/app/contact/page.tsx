import Link from "next/link";

export const metadata = { title: "Contact — Kôrô" };

export default function ContactPage() {
  return (
    <div className="page-head">
      <div className="wrap" style={{ maxWidth: 640 }}>
        <div className="crumb">
          <Link href="/">Accueil</Link> · Contact
        </div>
        <h1>Contact</h1>
        <p>Une question sur une mission, un paiement, ou envie de rejoindre Kôrô au Mali ?</p>

        <div className="info-item" style={{ marginTop: 28, maxWidth: 420 }}>
          <div className="k">Email</div>
          <div className="v">
            <a href="mailto:contact@koro.app" style={{ textDecoration: "underline" }}>
              contact@koro.app
            </a>
          </div>
        </div>

        <p className="hint" style={{ marginTop: 20 }}>
          Un formulaire de contact intégré arrivera dans une prochaine version — pour l&apos;instant,
          écrivez-nous directement par email.
        </p>
      </div>
    </div>
  );
}
