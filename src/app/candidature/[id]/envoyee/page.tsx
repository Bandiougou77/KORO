import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatMontant, uniteFromTypeTarif } from "@/lib/currency";
import { calculerRepartition } from "@/lib/repartition";

export default async function CandidatureEnvoyeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/connexion");

  const candidature = await db.candidature.findUnique({
    where: { id },
    include: { mission: { include: { entreprise: true } } },
  });

  if (!candidature || candidature.candidatId !== session.userId) notFound();

  const { mission } = candidature;
  const { net } = calculerRepartition(mission.montantBrut, mission.tauxCommission);
  const unite = uniteFromTypeTarif(mission.typeTarif);

  return (
    <section style={{ paddingTop: 90 }}>
      <div className="wrap" style={{ maxWidth: 640 }}>
        <div className="status-banner">
          <span className="status-dot"></span>
          <div>
            <strong>Candidature envoyée à {mission.entreprise.nomEntreprise}</strong>
            <span className="sub">Vous recevrez une réponse par notification, en général sous 48h.</span>
          </div>
        </div>

        <h1 style={{ fontSize: 30, marginBottom: 16 }}>Et maintenant, que se passe-t-il ?</h1>

        <div className="timeline" style={{ maxWidth: "100%" }}>
          <div className="tl-item">
            <div className="tl-num">1</div>
            <div className="tl-body">
              <h3>{mission.entreprise.nomEntreprise} examine votre profil</h3>
              <p>L&apos;entreprise voit votre profil et votre message. Elle peut vous répondre directement si elle a une question.</p>
            </div>
          </div>
          <div className="tl-item">
            <div className="tl-num">2</div>
            <div className="tl-body">
              <h3>Vous recevez sa réponse</h3>
              <p>Acceptée ou déclinée — dans les deux cas, vous êtes prévenu. Si c&apos;est accepté, la mission est automatiquement confirmée des deux côtés.</p>
            </div>
          </div>
          <div className="tl-item">
            <div className="tl-num">3</div>
            <div className="tl-body">
              <h3>Vous effectuez la mission</h3>
              <p>Vous vous rendez sur place (ou démarrez à distance) à la date convenue.</p>
            </div>
          </div>
          <div className="tl-item">
            <div className="tl-num">4</div>
            <div className="tl-body">
              <h3>Vous êtes payé sous 48h</h3>
              <p>
                Dès que l&apos;entreprise règle la mission, Kôrô vous reverse votre part —{" "}
                {formatMontant(net, mission.devise, unite)}, commission déjà déduite — directement sur votre compte.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 20 }}>
          <Link href="/offres" className="btn btn-dark btn-lg">
            Voir d&apos;autres missions
          </Link>
          <Link href="/" className="btn btn-ghost btn-lg" style={{ borderColor: "var(--line-dark)" }}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </section>
  );
}
