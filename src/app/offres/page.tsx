import Link from "next/link";
import { db } from "@/lib/db";
import { OffresList } from "./OffresList";

export const metadata = { title: "Toutes les missions — Kôrô" };

export default async function OffresPage() {
  const missions = await db.mission.findMany({
    where: { statut: "publiee" },
    include: {
      entreprise: { include: { _count: { select: { missions: { where: { statut: "payee" } } } } } },
    },
    orderBy: { dateCreation: "desc" },
  });

  return (
    <>
      <div className="page-head" style={{ paddingBottom: 32 }}>
        <div className="wrap">
          <div className="crumb">
            <Link href="/">Accueil</Link> · Annonces
          </div>
          <h1>Toutes les missions</h1>
          <p>Chaque annonce affiche le tarif exact avant que vous cliquiez. Filtrez pour trouver plus vite.</p>
        </div>
      </div>

      <section style={{ paddingTop: 36 }}>
        <div className="wrap">
          <OffresList missions={missions} />
        </div>
      </section>
    </>
  );
}
