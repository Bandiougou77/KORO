import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { rafraichirFraisPublicationSiChange } from "@/lib/fraisPublication";
import { formatMontant } from "@/lib/currency";
import { ActionButton } from "@/components/ActionButton";
import { confirmerPublicationMission } from "@/actions/missions";

export const metadata = { title: "Confirmer la publication — Kôrô" };

export default async function ConfirmerPublicationPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  const session = await getSession();
  if (!session || session.role !== "entreprise") {
    redirect(`/connexion?redirect=/publier/${missionId}/confirmer`);
  }

  const mission = await db.mission.findUnique({ where: { id: missionId } });
  if (!mission) notFound();
  if (mission.entrepriseId !== session.userId) notFound();

  if (mission.statut !== "brouillon") {
    // Déjà publiée (ou annulée) — rien à confirmer, on renvoie vers la fiche/le dashboard.
    redirect(mission.statut === "annulee" ? "/entreprise/dashboard" : `/offres/${mission.id}`);
  }

  // Toujours recalculé contre la configuration vivante, jamais contre ce qui a été vu avant —
  // voir lib/fraisPublication.ts. Le bandeau "le prix a changé" s'appuie sur ce résultat.
  const { frais, aChange } = await rafraichirFraisPublicationSiChange(missionId, mission.paysId);
  const gratuit = frais.statut === "gratuit";

  return (
    <div className="page-head">
      <div className="wrap" style={{ maxWidth: 560 }}>
        <div className="crumb">
          <Link href="/entreprise/dashboard">Dashboard entreprise</Link> · Confirmer la publication
        </div>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Confirmer la publication</h1>
        <p className="hint" style={{ marginBottom: 24 }}>
          {mission.titre}
        </p>

        {aChange && (
          <div className="status-banner" style={{ marginBottom: 20 }}>
            <span className="status-dot"></span>
            <div>
              <strong>Le prix de publication a changé depuis votre dernière visite</strong>
              <span className="sub">Vérifiez le montant ci-dessous avant de confirmer.</span>
            </div>
          </div>
        )}

        <div className="form-card" style={{ marginBottom: 24 }}>
          {gratuit ? (
            <p style={{ fontSize: 16 }}>
              <strong>Publication gratuite.</strong> Aucun paiement n&apos;est requis pour publier cette mission.
            </p>
          ) : (
            <>
              <div className="calc-row">
                <span>Frais de publication</span>
                <span className="val mono">{formatMontant(frais.montant, frais.devise)}</span>
              </div>
              <p className="hint" style={{ marginTop: 12 }}>
                Ce montant est distinct de la commission Kôrô (prélevée séparément sur la mission réalisée) — il
                rémunère uniquement la publication de l&apos;annonce.
              </p>
            </>
          )}
        </div>

        <ActionButton
          action={confirmerPublicationMission.bind(null, missionId)}
          label={gratuit ? "Publier la mission" : "Confirmer et payer"}
          pendingLabel="Publication…"
          className="btn btn-gold btn-lg"
          confirmMessage={gratuit ? undefined : "Confirmer le paiement des frais de publication ?"}
        />
      </div>
    </div>
  );
}
