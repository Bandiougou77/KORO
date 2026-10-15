import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { missionsEnAttenteValidationAdmin } from "@/lib/payment";
import { formatMontant } from "@/lib/currency";
import { ActionButton } from "@/components/ActionButton";
import { libererParAdmin } from "@/actions/admin";

export const metadata = { title: "Missions à valider — Kôrô" };

export default async function ValidationsAdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/connexion?redirect=/admin/validations");

  const missions = await missionsEnAttenteValidationAdmin();

  return (
    <div className="page-head">
      <div className="wrap">
        <div className="crumb">
          <Link href="/admin/revenus">Mes revenus</Link> · <Link href="/admin/litiges">Litiges</Link> · Missions à valider
        </div>
        <h1>Missions à valider</h1>
        <p>
          Missions terminées depuis plus de 3 jours sans confirmation de l&apos;entreprise ni litige ouvert —
          le versement n&apos;est jamais déclenché automatiquement, une décision humaine est requise.
        </p>

        <section style={{ paddingTop: 36 }}>
          {missions.length === 0 ? (
            <p style={{ opacity: 0.6 }}>Aucune mission en attente de validation pour le moment.</p>
          ) : (
            <div className="job-list">
              {missions.map((mission) => (
                <div key={mission.id} className="form-card" style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{mission.titre}</div>
                      <div style={{ fontSize: 13, opacity: 0.6 }}>
                        {mission.entreprise.nomEntreprise} · terminée le{" "}
                        {mission.dateTerminee?.toLocaleString("fr-FR")}
                      </div>
                      {mission.paiement && (
                        <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                          Total entreprise {formatMontant(mission.paiement.montantTotalEntreprise, mission.devise)} ·
                          prestataire reçoit {formatMontant(mission.paiement.montantNetCandidat, mission.devise)}
                        </div>
                      )}
                    </div>
                    <ActionButton
                      action={libererParAdmin.bind(null, mission.id)}
                      label="Libérer le paiement"
                      pendingLabel="Libération…"
                      className="btn btn-gold"
                      confirmMessage="Confirmer la libération du paiement vers le prestataire ?"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
