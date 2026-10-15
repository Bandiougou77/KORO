import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { calculerRepartition } from "@/lib/repartition";
import { formatMontant, uniteFromTypeTarif } from "@/lib/currency";
import { ReportButton } from "@/components/ReportButton";
import { ApplyForm } from "./ApplyForm";

function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function dureeLabel(dureeType: string) {
  return dureeType === "courte" ? "Court terme" : "Long terme";
}

function modeLabel(mode: string) {
  if (mode === "distance") return "À distance";
  if (mode === "les_deux") return "Sur site / distance";
  return "Sur site";
}

export default async function OffreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const mission = await db.mission.findUnique({
    where: { id },
    include: { entreprise: true },
  });

  if (!mission) notFound();

  const session = await getSession();
  const dejaPostule = session?.role === "candidat"
    ? await db.candidature.findUnique({
        where: { missionId_candidatId: { missionId: mission.id, candidatId: session.userId } },
      })
    : null;

  const { montantPrestataire } = calculerRepartition(mission.montantBrut, mission.tauxCommission);
  const unite = uniteFromTypeTarif(mission.typeTarif);
  const missionFermee = mission.statut !== "publiee";

  const missionsPayeesEntreprise = await db.mission.count({
    where: { entrepriseId: mission.entrepriseId, statut: "payee" },
  });
  const nouvelleEntreprise = missionsPayeesEntreprise === 0;

  return (
    <div className="page-head" style={{ paddingBottom: 40 }}>
      <div className="wrap">
        <div className="crumb">
          <Link href="/">Accueil</Link> · <Link href="/offres">Annonces</Link> · {mission.titre}
        </div>

        <div className="offer-hero">
          <div>
            <div className="offer-title-row">
              <div className="job-logo" style={{ width: 52, height: 52, fontSize: 17 }}>
                {initials(mission.entreprise.nomEntreprise)}
              </div>
              <div>
                <h1 style={{ fontSize: 30, marginBottom: 4 }}>{mission.titre}</h1>
                <p style={{ opacity: 0.65, fontSize: 15 }}>
                  {mission.entreprise.nomEntreprise}
                  {mission.lieu ? ` · ${mission.lieu}` : ""}
                </p>
              </div>
            </div>

            <div className="job-badges" style={{ marginBottom: 24 }}>
              <span className="badge">{modeLabel(mission.mode)}</span>
              <span className="badge">{dureeLabel(mission.dureeType)}</span>
              {nouvelleEntreprise && (
                <span className="badge" style={{ borderColor: "var(--gold)", color: "var(--ink)" }}>
                  Nouveau sur Kôrô
                </span>
              )}
            </div>

            <p className="offer-summary">{mission.description}</p>

            <div className="info-grid">
              <div className="info-item">
                <div className="k">Durée</div>
                <div className="v">{mission.dureeType === "courte" ? "Moins de 3 mois" : "3 mois et plus"}</div>
              </div>
              <div className="info-item">
                <div className="k">Début souhaité</div>
                <div className="v">
                  {mission.dateDebut
                    ? new Date(mission.dateDebut).toLocaleDateString("fr-FR")
                    : "Dès que possible"}
                </div>
              </div>
              <div className="info-item">
                <div className="k">Type de tarif</div>
                <div className="v">
                  {mission.typeTarif === "horaire"
                    ? "Taux horaire"
                    : mission.typeTarif === "mensuel"
                      ? "Mensuel"
                      : "Forfait mission"}
                </div>
              </div>
              <div className="info-item">
                <div className="k">Statut</div>
                <div className="v">{missionFermee ? "Candidatures fermées" : "Ouverte aux candidatures"}</div>
              </div>
            </div>
          </div>

          <aside className="apply-card">
            <div className="preview-tag">Ce que vous recevrez</div>
            <div className="amount-big mono">
              {formatMontant(montantPrestataire, mission.devise)}
              {unite && <span style={{ fontSize: 16 }}>/{unite}</span>}
            </div>
            <div className="amount-note">
              Montant intégral, sans déduction — la commission Kôrô ({mission.tauxCommission}%) est à la charge de
              l&apos;entreprise, ajoutée par-dessus.
            </div>

            {missionFermee ? (
              <p className="hint" style={{ color: "var(--gold-soft)" }}>
                Cette mission n&apos;accepte plus de candidatures.
              </p>
            ) : dejaPostule ? (
              <p className="hint" style={{ color: "var(--gold-soft)" }}>
                Vous avez déjà postulé à cette mission.
              </p>
            ) : session?.role === "entreprise" ? (
              <p className="hint">Connectez-vous avec un compte candidat pour postuler.</p>
            ) : session?.role === "candidat" ? (
              <ApplyForm missionId={mission.id} />
            ) : (
              <Link
                href={`/connexion?redirect=/offres/${mission.id}`}
                className="btn btn-gold btn-lg"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Se connecter pour postuler
              </Link>
            )}

            <ul className="apply-steps">
              <li>
                <span className="n">1</span> Votre profil est envoyé à {mission.entreprise.nomEntreprise}
              </li>
              <li>
                <span className="n">2</span> Si acceptée, le paiement est immédiatement sécurisé par Kôrô
              </li>
              <li>
                <span className="n">3</span> Vous effectuez la mission, puis la marquez terminée
              </li>
              <li>
                <span className="n">4</span> Le paiement est libéré vers votre solde Kôrô
              </li>
            </ul>
          </aside>
        </div>

        {session?.role === "candidat" && (
          <div style={{ marginTop: 24 }}>
            <ReportButton cibleId={mission.entrepriseId} missionId={mission.id} label="Signaler cette entreprise" />
          </div>
        )}
      </div>
    </div>
  );
}
