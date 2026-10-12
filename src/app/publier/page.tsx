import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PublierForm } from "./PublierForm";

export const metadata = { title: "Publier une mission — Kôrô" };

export default async function PublierPage() {
  const session = await getSession();

  if (!session) redirect("/connexion?redirect=/publier");
  if (session.role !== "entreprise") redirect("/?msg=entreprise_requise");

  const entreprise = await db.entreprise.findUniqueOrThrow({ where: { userId: session.userId } });

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <div className="crumb">
            <Link href="/">Accueil</Link> · Publier une mission
          </div>
          <h1>Décrivez votre besoin, on s&apos;occupe du reste</h1>
          <p>
            Trois minutes pour remplir. Votre annonce est publiée immédiatement, et vous voyez à
            droite exactement ce qu&apos;un candidat verra — et ce que la mission vous coûtera au
            total.
          </p>
        </div>
      </div>

      <section>
        <div className="wrap">
          <div className="status-banner" style={{ marginBottom: 28 }}>
            <span className="status-dot"></span>
            <div>
              <strong>Ne réglez jamais une mission en dehors de Kôrô</strong>
              <span className="sub">Même si on vous le demande directement — tout paiement passe par la plateforme, sans exception.</span>
            </div>
          </div>
          <PublierForm nomEntreprise={entreprise.nomEntreprise} />
        </div>
      </section>
    </>
  );
}
