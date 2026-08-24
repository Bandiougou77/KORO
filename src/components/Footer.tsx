import Link from "next/link";

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div>
          <Link href="/" className="logo" style={{ marginBottom: 14, textDecoration: "none" }}>
            <span className="logo-mark"></span>Kôrô
          </Link>
          <p style={{ fontSize: 13.5, opacity: 0.55, maxWidth: 240, lineHeight: 1.6 }}>
            &quot;Kôrô&quot;, le lien — la mise en relation directe entre entreprises et
            travailleurs, sans agence entre les deux.
          </p>
        </div>
        <div className="foot-cols">
          <div className="foot-col">
            <h4>Candidats</h4>
            <Link href="/offres">Voir les missions</Link>
            <Link href="/comment-ca-marche">Comment ça marche</Link>
            <Link href="/commission">Sécurité des paiements</Link>
          </div>
          <div className="foot-col">
            <h4>Entreprises</h4>
            <Link href="/publier">Publier une offre</Link>
            <Link href="/commission">Grille de commission</Link>
            <Link href="/devenir-partenaire">Devenir partenaire</Link>
          </div>
          <div className="foot-col">
            <h4>Plateforme</h4>
            <Link href="/conditions-utilisation">Conditions d&apos;utilisation</Link>
            <Link href="/statut-juridique">Statut juridique</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>
      <div className="wrap foot-bottom">
        <span>© 2026 Kôrô — maquette de concept</span>
        <span>Plateforme de mise en relation, non-employeur</span>
      </div>
    </footer>
  );
}
