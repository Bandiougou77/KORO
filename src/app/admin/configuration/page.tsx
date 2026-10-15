import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMontant } from "@/lib/currency";
import { ConfigFraisPublicationForm } from "./ConfigFraisPublicationForm";

export const metadata = { title: "Configuration — Kôrô" };

export default async function ConfigurationAdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/connexion?redirect=/admin/configuration");

  const pays = await db.pays.findMany({ orderBy: { nom: "asc" } });
  const configsActuelles = await Promise.all(
    pays.map(async (p) => ({
      pays: p,
      config: await db.configFraisPublication.findFirst({
        where: { paysId: p.id, dateEffective: { lte: new Date() } },
        orderBy: { dateEffective: "desc" },
      }),
    })),
  );
  const historique = await db.configFraisPublication.findMany({
    include: { pays: true },
    orderBy: { dateEffective: "desc" },
    take: 20,
  });

  return (
    <div className="page-head">
      <div className="wrap">
        <div className="crumb">
          <Link href="/admin/revenus">Mes revenus</Link> · Configuration
        </div>
        <h1>Frais de publication</h1>
        <p>
          Gratuit par défaut au lancement. Chaque changement s&apos;applique uniquement aux missions créées après
          lui — jamais rétroactif sur une publication déjà en cours.
        </p>

        <section style={{ paddingTop: 36 }}>
          {configsActuelles.map(({ pays: p, config }) => (
            <div key={p.id} className="form-card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 8 }}>{p.nom}</h3>
              <p className="hint" style={{ marginBottom: 16 }}>
                Actuellement :{" "}
                {!config || !config.actif
                  ? "gratuit"
                  : `${formatMontant(config.montant, config.devise)} par publication`}
              </p>
              <ConfigFraisPublicationForm
                paysId={p.id}
                actifParDefaut={config?.actif ?? false}
                montantParDefaut={config?.montant ?? 0}
              />
            </div>
          ))}
        </section>

        <section style={{ paddingTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Historique des changements</h2>
          {historique.length === 0 ? (
            <p style={{ opacity: 0.6 }}>Aucun changement enregistré pour le moment.</p>
          ) : (
            historique.map((h) => (
              <div className="calc-row" key={h.id}>
                <span>
                  {h.pays.nom} — {h.actif ? formatMontant(h.montant, h.devise) : "gratuit"}
                </span>
                <span className="val" style={{ fontSize: 12, opacity: 0.6 }}>
                  {h.dateEffective.toLocaleString("fr-FR")}
                </span>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
