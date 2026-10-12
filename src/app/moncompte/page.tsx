import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatMontant, uniteFromTypeTarif } from "@/lib/currency";
import { liberationsAutomatiquesEnRetard } from "@/lib/payment";
import { StatusBadge } from "@/components/StatusBadge";
import { MessageThread } from "@/components/MessageThread";
import { ReportButton } from "@/components/ReportButton";
import { ActionButton } from "@/components/ActionButton";
import { marquerMissionTerminee } from "@/actions/candidatures";

export const metadata = { title: "Mon compte — Kôrô" };

const DELAI_LIBERATION_MS = 48 * 60 * 60 * 1000;

export default async function MonComptePage() {
  const session = await getSession();
  if (!session || session.role !== "candidat") redirect("/connexion?redirect=/moncompte");

  await liberationsAutomatiquesEnRetard();

  const candidatures = await db.candidature.findMany({
    where: { candidatId: session.userId },
    include: {
      mission: {
        include: {
          entreprise: true,
          paiement: true,
          litige: true,
          messages: { include: { expediteur: { include: { profilCandidat: true, entreprise: true } } }, orderBy: { dateEnvoi: "asc" } },
        },
      },
    },
    orderBy: { dateCreation: "desc" },
  });

  const paiements = candidatures.filter((c) => c.mission.paiement?.statut === "effectue");
  const missionActive = candidatures.find(
    (c) => c.statut === "acceptee" && ["paiement_securise", "terminee", "litige"].includes(c.mission.statut),
  );
  const solde = await db.solde.findUnique({ where: { candidatId: session.userId } });

  return (
    <div className="page-head">
      <div className="wrap">
        <div className="crumb">
          <Link href="/">Accueil</Link> · Mon compte
        </div>
        <h1>Mon compte candidat</h1>
        <p>Retrouvez ici vos candidatures et l&apos;historique de vos paiements.</p>
      </div>

      <section style={{ paddingTop: 36 }}>
        <div className="wrap">
          <div className="calc-card" style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div className="pipe-tag" style={{ marginBottom: 8 }}>
                Solde disponible
              </div>
              <div className="amount-big mono">{formatMontant(solde?.montantDisponible ?? 0, solde?.devise ?? "FCFA")}</div>
            </div>
            <Link href="/moncompte/solde" className="btn btn-gold">
              Voir mon solde →
            </Link>
          </div>

          {missionActive && (
            <>
              <div className="section-head">
                <h2 style={{ fontSize: 22 }}>Mission en cours</h2>
              </div>
              <div className="form-card" style={{ marginBottom: 40 }}>
                {(() => {
                  const mission = missionActive.mission;
                  const dateLimite = mission.dateTerminee
                    ? new Date(mission.dateTerminee.getTime() + DELAI_LIBERATION_MS)
                    : null;
                  const messages = mission.messages.map((m) => ({
                    id: m.id,
                    contenu: m.contenu,
                    dateEnvoi: m.dateEnvoi,
                    expediteurId: m.expediteurId,
                    expediteurLabel:
                      m.expediteur.entreprise?.nomEntreprise ??
                      (m.expediteur.profilCandidat ? `${m.expediteur.profilCandidat.prenom} ${m.expediteur.profilCandidat.nom}` : "—"),
                  }));

                  return (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 4 }}>{mission.titre}</div>
                          <div style={{ fontSize: 13, opacity: 0.6 }}>{mission.entreprise.nomEntreprise}</div>
                        </div>
                        <StatusBadge statut={mission.statut} kind="mission" />
                      </div>

                      {mission.statut === "paiement_securise" && (
                        <>
                          <p className="hint" style={{ marginBottom: 12 }}>
                            Le paiement est sécurisé. Marquez la mission comme terminée une fois le travail effectué.
                          </p>
                          <div style={{ marginBottom: 12 }}>
                            <ActionButton
                              action={marquerMissionTerminee.bind(null, mission.id)}
                              label="Marquer la mission comme terminée"
                              pendingLabel="Enregistrement…"
                              className="btn btn-gold"
                              confirmMessage="Confirmer que la mission est terminée ?"
                            />
                          </div>
                        </>
                      )}

                      {mission.statut === "terminee" && dateLimite && (
                        <p className="hint" style={{ marginBottom: 12 }}>
                          En attente de confirmation de l&apos;entreprise — libération automatique le{" "}
                          {dateLimite.toLocaleString("fr-FR")} si pas de réponse.
                        </p>
                      )}

                      {mission.statut === "litige" && (
                        <p className="hint" style={{ marginBottom: 12, color: "#C24A32" }}>
                          Un litige est ouvert sur cette mission — le paiement reste bloqué en attendant un examen.
                        </p>
                      )}

                      <ReportButton cibleId={mission.entrepriseId} missionId={mission.id} label="Signaler cette entreprise" />
                      <MessageThread missionId={mission.id} messages={messages} currentUserId={session.userId} />
                    </>
                  );
                })()}
              </div>
            </>
          )}

          <div className="section-head">
            <h2 style={{ fontSize: 22 }}>Mes candidatures</h2>
          </div>

          {candidatures.length === 0 ? (
            <p style={{ opacity: 0.6 }}>
              Vous n&apos;avez pas encore postulé.{" "}
              <Link href="/offres" style={{ textDecoration: "underline" }}>
                Voir les missions
              </Link>
            </p>
          ) : (
            <div className="job-list" style={{ marginBottom: 60 }}>
              {candidatures.map((c) => (
                <Link
                  key={c.id}
                  href={`/offres/${c.mission.id}`}
                  className="job-card"
                  style={{ textDecoration: "none" }}
                >
                  <div className="job-logo">{c.mission.entreprise.nomEntreprise.slice(0, 2).toUpperCase()}</div>
                  <div className="job-main">
                    <div className="job-title">{c.mission.titre}</div>
                    <div className="job-sub">{c.mission.entreprise.nomEntreprise}</div>
                  </div>
                  <StatusBadge statut={c.statut} kind="candidature" />
                  <div className="job-pay">
                    <div className="amount mono">
                      {formatMontant(c.mission.montantBrut, c.mission.devise, uniteFromTypeTarif(c.mission.typeTarif))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="section-head">
            <h2 style={{ fontSize: 22 }}>Historique des paiements</h2>
          </div>

          {paiements.length === 0 ? (
            <p style={{ opacity: 0.6 }}>Aucun paiement reçu pour le moment.</p>
          ) : (
            <div className="job-list">
              {paiements.map((c) => (
                <div key={c.id} className="job-card">
                  <div className="job-logo">{c.mission.entreprise.nomEntreprise.slice(0, 2).toUpperCase()}</div>
                  <div className="job-main">
                    <div className="job-title">{c.mission.titre}</div>
                    <div className="job-sub">{c.mission.entreprise.nomEntreprise}</div>
                  </div>
                  <StatusBadge statut={c.mission.statut} kind="mission" />
                  <div className="job-pay">
                    <div className="amount mono">
                      {c.mission.paiement ? formatMontant(c.mission.paiement.montantNetCandidat, c.mission.devise) : "—"}
                    </div>
                    <div className="fee">net reçu</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
