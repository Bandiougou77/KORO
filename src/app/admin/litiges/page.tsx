import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMontant } from "@/lib/currency";

export const metadata = { title: "Litiges — Kôrô" };

const STATUTS_FILTRABLES = ["ouvert", "en_examen", "informations_demandees", "resolu"] as const;

const LABELS_STATUT: Record<string, string> = {
  ouvert: "Ouvert",
  en_examen: "En cours d'examen",
  informations_demandees: "Informations demandées",
  resolu: "Résolu",
};

export default async function LitigesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; motif?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/connexion?redirect=/admin/litiges");

  const { statut, motif } = await searchParams;

  const litiges = await db.litige.findMany({
    where: {
      ...(statut && STATUTS_FILTRABLES.includes(statut as (typeof STATUTS_FILTRABLES)[number]) ? { statut: statut as (typeof STATUTS_FILTRABLES)[number] } : {}),
      ...(motif ? { motif: { contains: motif } } : {}),
    },
    include: { mission: { include: { entreprise: true, paiement: true } }, ouvertPar: true },
    orderBy: { dateOuverture: "desc" },
  });

  return (
    <div className="page-head">
      <div className="wrap">
        <div className="crumb">
          <Link href="/admin/revenus">Mes revenus</Link> · <Link href="/admin/validations">Missions à valider</Link> · Litiges
        </div>
        <h1>Litiges</h1>
        <p>{litiges.length} litige{litiges.length > 1 ? "s" : ""}.</p>

        <form method="GET" style={{ display: "flex", gap: 10, marginTop: 20, marginBottom: 24, flexWrap: "wrap" }}>
          <select name="statut" defaultValue={statut ?? ""}>
            <option value="">Tous les états</option>
            {STATUTS_FILTRABLES.map((s) => (
              <option key={s} value={s}>
                {LABELS_STATUT[s]}
              </option>
            ))}
          </select>
          <input type="text" name="motif" placeholder="Rechercher par motif…" defaultValue={motif ?? ""} />
          <button type="submit" className="btn btn-ghost">
            Filtrer
          </button>
        </form>

        {litiges.length === 0 ? (
          <p style={{ opacity: 0.6 }}>Aucun litige ne correspond à ces critères.</p>
        ) : (
          <div className="job-list">
            {litiges.map((l) => (
              <Link key={l.id} href={`/admin/litiges/${l.id}`} className="form-card" style={{ display: "block", marginBottom: 16, textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{l.mission.titre}</div>
                    <div style={{ fontSize: 13, opacity: 0.6 }}>
                      {l.mission.entreprise.nomEntreprise} · motif : {l.motif} · ouvert le{" "}
                      {l.dateOuverture.toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="pipe-chip">{LABELS_STATUT[l.statut] ?? l.statut}</span>
                    {l.mission.paiement && (
                      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
                        {formatMontant(l.mission.paiement.montantTotalEntreprise, l.mission.devise)} en jeu
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
