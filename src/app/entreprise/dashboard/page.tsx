import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatMontant, uniteFromTypeTarif } from "@/lib/currency";
import { moyenPaiementLabel } from "@/lib/moyenPaiement";
import { liberationsAutomatiquesEnRetard } from "@/lib/payment";
import { StatusBadge } from "@/components/StatusBadge";
import { MessageThread } from "@/components/MessageThread";
import { LitigeButton } from "@/components/LitigeButton";
import { ReportButton } from "@/components/ReportButton";
import { ActionButton } from "@/components/ActionButton";
import { declineCandidature } from "@/actions/candidatures";
import { cancelMission } from "@/actions/missions";
import { confirmerEtLibererPaiement } from "@/actions/paiements";
import { AcceptForm } from "./AcceptForm";

export const metadata = { title: "Dashboard entreprise — Kôrô" };

const DELAI_LIBERATION_MS = 48 * 60 * 60 * 1000;

export default async function EntrepriseDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "entreprise") redirect("/connexion?redirect=/entreprise/dashboard");

  await liberationsAutomatiquesEnRetard();

  const missions = await db.mission.findMany({
    where: { entrepriseId: session.userId },
    include: {
      candidatures: { include: { candidat: true }, orderBy: { dateCreation: "desc" } },
      paiement: true,
      pays: true,
      litige: true,
      messages: { include: { expediteur: { include: { profilCandidat: true, entreprise: true } } }, orderBy: { dateEnvoi: "asc" } },
    },
    orderBy: { dateCreation: "desc" },
  });

  const totalPaiements = missions.filter((m) => m.paiement?.statut === "effectue").length;

  return (
    <div className="page-head">
      <div className="wrap">
        <div className="crumb">
          <Link href="/">Accueil</Link> · Dashboard entreprise
        </div>
        <h1>Dashboard entreprise</h1>
        <p>
          {missions.length} annonce{missions.length > 1 ? "s" : ""} · {totalPaiements} paiement
          {totalPaiements > 1 ? "s" : ""} effectué{totalPaiements > 1 ? "s" : ""}
        </p>
        <div style={{ marginTop: 20 }}>
          <Link href="/publier" className="btn btn-gold btn-lg">
            Publier une nouvelle mission
          </Link>
        </div>
      </div>

      <section style={{ paddingTop: 36 }}>
        <div className="wrap">
          {missions.length === 0 && <p style={{ opacity: 0.6 }}>Vous n&apos;avez pas encore publié de mission.</p>}

          {missions.map((mission) => {
            const unite = uniteFromTypeTarif(mission.typeTarif);
            const peutAnnuler = mission.statut === "publiee";
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
              <div key={mission.id} className="form-card" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 4 }}>
                      <Link href={`/offres/${mission.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        {mission.titre}
                      </Link>
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.6 }}>
                      {formatMontant(mission.montantBrut, mission.devise, unite)} · commission {mission.tauxCommission}%
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <StatusBadge statut={mission.statut} kind="mission" />
                    {mission.statut === "terminee" && (
                      <ActionButton
                        action={confirmerEtLibererPaiement.bind(null, mission.id)}
                        label="Confirmer et libérer le paiement"
                        pendingLabel="Libération…"
                        className="btn btn-gold"
                        confirmMessage="Confirmer la libération du paiement vers le candidat ? Cette action est irréversible."
                      />
                    )}
                    {peutAnnuler && (
                      <ActionButton
                        action={cancelMission.bind(null, mission.id)}
                        label="Annuler"
                        pendingLabel="Annulation…"
                        confirmMessage="Annuler cette mission ?"
                      />
                    )}
                  </div>
                </div>

                {mission.statut === "paiement_securise" && (
                  <p className="hint" style={{ marginBottom: 16 }}>
                    Paiement sécurisé — en attente que le candidat marque la mission comme terminée.
                  </p>
                )}

                {mission.statut === "terminee" && dateLimite && (
                  <p className="hint" style={{ marginBottom: 16 }}>
                    Le candidat a marqué la mission terminée. Sans confirmation ni litige avant le{" "}
                    {dateLimite.toLocaleString("fr-FR")}, le paiement sera libéré automatiquement.
                  </p>
                )}

                {mission.statut === "litige" && (
                  <p className="hint" style={{ marginBottom: 16, color: "#C24A32" }}>
                    Un litige est ouvert sur cette mission — le paiement reste bloqué en attendant un examen.
                  </p>
                )}

                {mission.paiement?.statut === "effectue" && (
                  <p className="hint" style={{ marginBottom: 16 }}>
                    Payée le {mission.paiement.datePaiement ? new Date(mission.paiement.datePaiement).toLocaleDateString("fr-FR") : ""} via{" "}
                    {mission.paiement.moyenPaiement ? moyenPaiementLabel(mission.paiement.moyenPaiement) : "—"} — commission{" "}
                    {formatMontant(mission.paiement.commission, mission.devise)}, frais{" "}
                    {formatMontant(mission.paiement.fraisPaiement, mission.devise)}, net candidat{" "}
                    {formatMontant(mission.paiement.montantNetCandidat, mission.devise)}.
                  </p>
                )}

                {["paiement_securise", "terminee", "litige"].includes(mission.statut) && !mission.litige && (
                  <LitigeButton missionId={mission.id} />
                )}

                {mission.candidatures.length === 0 ? (
                  <p className="hint">Aucune candidature reçue pour le moment.</p>
                ) : (
                  <div className="job-list" style={{ marginTop: 12 }}>
                    {mission.candidatures.map((c) => (
                      <div key={c.id} className="job-card" style={{ gridTemplateColumns: "auto 1fr auto auto" }}>
                        <div className="job-logo">
                          {(c.candidat.prenom[0] + c.candidat.nom[0]).toUpperCase()}
                        </div>
                        <div className="job-main">
                          <div className="job-title">
                            {c.candidat.prenom} {c.candidat.nom}
                          </div>
                          <div className="job-sub">{c.message || "Aucun message"}</div>
                        </div>
                        <StatusBadge statut={c.statut} kind="candidature" />
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {c.statut === "envoyee" && mission.statut === "publiee" && (
                            <>
                              <AcceptForm
                                candidatureId={c.id}
                                moyensDisponibles={mission.pays.moyensPaiementDisponibles.split(",").map((m) => m.trim()).filter(Boolean)}
                              />
                              <ActionButton
                                action={declineCandidature.bind(null, c.id)}
                                label="Décliner"
                                pendingLabel="…"
                              />
                            </>
                          )}
                          <ReportButton cibleId={c.candidatId} missionId={mission.id} label="Signaler" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {["paiement_securise", "terminee", "litige", "payee"].includes(mission.statut) && (
                  <MessageThread missionId={mission.id} messages={messages} currentUserId={session.userId} />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
