import Link from "next/link";
import { formatMontant, uniteFromTypeTarif } from "@/lib/currency";
import type { Mission, Entreprise } from "@/generated/prisma/client";

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

export type JobCardMission = Mission & {
  entreprise: Entreprise & { _count?: { missions: number } };
};

export function JobCard({ mission }: { mission: JobCardMission }) {
  const taux = mission.dureeType === "courte" ? 6 : 5;
  const nouvelleEntreprise = mission.entreprise._count?.missions === 0;
  return (
    <Link href={`/offres/${mission.id}`} className="job-card" style={{ textDecoration: "none" }}>
      <div className="job-logo">{initials(mission.entreprise.nomEntreprise)}</div>
      <div className="job-main">
        <div className="job-title">{mission.titre}</div>
        <div className="job-sub">
          {mission.entreprise.nomEntreprise}
          {mission.lieu ? ` · ${mission.lieu}` : ""}
        </div>
      </div>
      <div className="job-badges">
        <span className={`badge${mission.mode === "distance" ? " remote" : ""}`}>
          {modeLabel(mission.mode)}
        </span>
        <span className="badge">{dureeLabel(mission.dureeType)}</span>
        {nouvelleEntreprise && <span className="badge remote">Nouveau</span>}
      </div>
      <div className="job-pay">
        <div className="amount mono">
          {formatMontant(mission.montantBrut, mission.devise, uniteFromTypeTarif(mission.typeTarif))}
        </div>
        <div className="fee">− {taux}% commission</div>
      </div>
    </Link>
  );
}
