import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatMontant } from "@/lib/currency";
import { parseMoyensPaiement, moyenPaiementLabel } from "@/lib/pays";
import { RetraitForm } from "./RetraitForm";

export const metadata = { title: "Mon solde — Kôrô" };

export default async function SoldePage() {
  const session = await getSession();
  if (!session || session.role !== "candidat") redirect("/connexion?redirect=/moncompte/solde");

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
    include: { pays: true, profilCandidat: true },
  });

  const solde = await db.solde.upsert({
    where: { candidatId: session.userId },
    create: { candidatId: session.userId, montantDisponible: 0, devise: user.pays.devise },
    update: {},
  });

  const mouvements = await db.mouvementSolde.findMany({
    where: { soldeId: session.userId },
    include: { mission: true, retrait: true },
    orderBy: { dateCreation: "desc" },
  });

  const moyensDisponibles = parseMoyensPaiement(user.pays.moyensPaiementDisponibles);

  return (
    <div className="page-head">
      <div className="wrap" style={{ maxWidth: 640 }}>
        <div className="crumb">
          <Link href="/">Accueil</Link> · <Link href="/moncompte">Mon compte</Link> · Mon solde
        </div>
        <h1>Mon solde</h1>
        <p>Ce que vous avez gagné sur Kôrô, et ce qu&apos;il vous reste à retirer.</p>

        <div className="calc-card" style={{ marginTop: 24, marginBottom: 32 }}>
          <div className="pipe-tag" style={{ marginBottom: 10 }}>
            Solde disponible
          </div>
          <div className="amount-big mono" style={{ marginBottom: 24 }}>
            {formatMontant(solde.montantDisponible, solde.devise)}
          </div>

          {mouvements.length === 0 ? (
            <p style={{ opacity: 0.65, fontSize: 14 }}>Aucun mouvement pour le moment.</p>
          ) : (
            mouvements.map((m) => {
              const estCredit = m.type === "credit_mission";
              const label = estCredit
                ? m.mission?.titre ?? "Mission payée"
                : `Retrait vers ${m.retrait ? moyenPaiementLabel(m.retrait.moyenRetrait) : "—"}`;
              const sousLabel = estCredit
                ? new Date(m.dateCreation).toLocaleDateString("fr-FR")
                : `${m.retrait?.statut === "recu" ? "Reçu" : "En cours"} · ${new Date(m.dateCreation).toLocaleDateString("fr-FR")}`;
              return (
                <div className="calc-row" key={m.id}>
                  <span>
                    {label}
                    <br />
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{sousLabel}</span>
                  </span>
                  <span className="val" style={estCredit ? { color: "var(--gold-soft)" } : undefined}>
                    {estCredit ? "+ " : "− "}
                    {formatMontant(m.montant, solde.devise)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <RetraitForm
          soldeDisponible={Math.floor(solde.montantDisponible)}
          moyensDisponibles={moyensDisponibles}
          identifiantParDefaut={user.profilCandidat?.identifiantPaiement ?? ""}
        />
      </div>
    </div>
  );
}
