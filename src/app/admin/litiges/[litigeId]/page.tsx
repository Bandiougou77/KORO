import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMontant } from "@/lib/currency";
import { MessageThread } from "@/components/MessageThread";
import { ResolutionLitigeForm } from "./ResolutionLitigeForm";
import { DemandeInformationsForm } from "./DemandeInformationsForm";

export const metadata = { title: "Litige — Kôrô" };

const LABELS_STATUT: Record<string, string> = {
  ouvert: "Ouvert",
  en_examen: "En cours d'examen",
  informations_demandees: "Informations demandées",
  resolu: "Résolu",
};

const LABELS_DECISION: Record<string, string> = {
  paiement_candidat: "Résolu en faveur du prestataire",
  remboursement_entreprise: "Résolu en faveur de l'entreprise",
  partage: "Résolu en partage",
  compte_suspendu: "Compte suspendu",
};

export default async function LitigeDetailPage({
  params,
}: {
  params: Promise<{ litigeId: string }>;
}) {
  const { litigeId } = await params;
  const session = await getSession();
  if (!session || session.role !== "admin") redirect(`/connexion?redirect=/admin/litiges/${litigeId}`);

  const litige = await db.litige.findUnique({
    where: { id: litigeId },
    include: {
      ouvertPar: { include: { entreprise: true, profilCandidat: true } },
      resoluPar: true,
      mission: {
        include: {
          entreprise: true,
          paiement: true,
          candidatures: { where: { statut: "acceptee" }, include: { candidat: true } },
          messages: {
            include: { expediteur: { include: { entreprise: true, profilCandidat: true } } },
            orderBy: { dateEnvoi: "asc" },
          },
        },
      },
    },
  });
  if (!litige) notFound();

  const candidatureAcceptee = litige.mission.candidatures[0];
  const messages = litige.mission.messages.map((m) => ({
    id: m.id,
    contenu: m.contenu,
    dateEnvoi: m.dateEnvoi,
    expediteurId: m.expediteurId,
    expediteurLabel:
      m.expediteurId === session.userId
        ? "Vous (équipe Kôrô)"
        : (m.expediteur.entreprise?.nomEntreprise ??
          (m.expediteur.profilCandidat ? `${m.expediteur.profilCandidat.prenom} ${m.expediteur.profilCandidat.nom}` : "Kôrô")),
  }));

  return (
    <div className="page-head">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div className="crumb">
          <Link href="/admin/litiges">Litiges</Link> · {litige.mission.titre}
        </div>
        <h1 style={{ fontSize: 26 }}>{litige.mission.titre}</h1>
        <p className="hint">
          Statut : <strong>{LABELS_STATUT[litige.statut] ?? litige.statut}</strong>
          {litige.decision && <> · {LABELS_DECISION[litige.decision] ?? litige.decision}</>}
        </p>

        <div className="form-card" style={{ marginTop: 24, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Informations financières</h3>
          <div className="calc-row">
            <span>Montant convenu avec le prestataire</span>
            <span className="val">{formatMontant(litige.mission.montantBrut, litige.mission.devise)}</span>
          </div>
          <div className="calc-row">
            <span>Commission Kôrô ({litige.mission.tauxCommission}%)</span>
            <span className="val">{litige.mission.paiement ? formatMontant(litige.mission.paiement.commission, litige.mission.devise) : "—"}</span>
          </div>
          <div className="calc-row">
            <span>Total payé par l&apos;entreprise</span>
            <span className="val">
              {litige.mission.paiement ? formatMontant(litige.mission.paiement.montantTotalEntreprise, litige.mission.devise) : "—"}
            </span>
          </div>
          <div className="calc-row">
            <span>Statut du paiement</span>
            <span className="val">{litige.mission.paiement?.statut ?? "—"}</span>
          </div>
        </div>

        <div className="form-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Parties prenantes</h3>
          <div className="calc-row">
            <span>Entreprise</span>
            <span className="val">{litige.mission.entreprise.nomEntreprise}</span>
          </div>
          <div className="calc-row">
            <span>Prestataire</span>
            <span className="val">
              {candidatureAcceptee ? `${candidatureAcceptee.candidat.prenom} ${candidatureAcceptee.candidat.nom}` : "—"}
            </span>
          </div>
          <div className="calc-row">
            <span>Litige ouvert par</span>
            <span className="val">
              {litige.ouvertPar.entreprise?.nomEntreprise ??
                (litige.ouvertPar.profilCandidat ? `${litige.ouvertPar.profilCandidat.prenom} ${litige.ouvertPar.profilCandidat.nom}` : "—")}
            </span>
          </div>
        </div>

        <div className="form-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 8 }}>Motif initial</h3>
          <p style={{ marginBottom: 8 }}>{litige.motif}</p>
          {litige.elementsFournis && <p className="hint">{litige.elementsFournis}</p>}
          <p className="hint" style={{ marginTop: 8 }}>
            Ouvert le {litige.dateOuverture.toLocaleString("fr-FR")}
          </p>
        </div>

        {litige.statut === "resolu" ? (
          <div className="form-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 8 }}>Décision</h3>
            <p style={{ marginBottom: 8 }}>{LABELS_DECISION[litige.decision ?? ""] ?? litige.decision}</p>
            {litige.motifDecision && <p className="hint">{litige.motifDecision}</p>}
            <p className="hint" style={{ marginTop: 8 }}>
              Par {litige.resoluPar?.email ?? "—"} le {litige.dateResolution?.toLocaleString("fr-FR")}
            </p>
          </div>
        ) : (
          <>
            <DemandeInformationsForm litigeId={litige.id} />
            <ResolutionLitigeForm
              litigeId={litige.id}
              entrepriseId={litige.mission.entrepriseId}
              candidatId={candidatureAcceptee?.candidatId}
            />
          </>
        )}

        <h3 style={{ marginTop: 28, marginBottom: 8 }}>Historique des échanges de la mission</h3>
        <MessageThread missionId={litige.missionId} messages={messages} currentUserId={session.userId} lectureSeule />
      </div>
    </div>
  );
}
