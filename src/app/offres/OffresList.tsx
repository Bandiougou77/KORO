"use client";

import { useState } from "react";
import { JobCard, type JobCardMission } from "@/components/JobCard";

type Filter = "all" | "court" | "long" | "distance" | "site";

function tagsFor(mission: JobCardMission): string[] {
  const tags: string[] = [];
  tags.push(mission.dureeType === "courte" ? "court" : "long");
  if (mission.mode === "distance" || mission.mode === "les_deux") tags.push("distance");
  if (mission.mode === "sur_site" || mission.mode === "les_deux") tags.push("site");
  return tags;
}

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "court", label: "Court terme" },
  { key: "long", label: "Long terme" },
  { key: "distance", label: "À distance" },
  { key: "site", label: "Sur site" },
];

export function OffresList({ missions }: { missions: JobCardMission[] }) {
  const [active, setActive] = useState<Filter>("all");

  const visible = missions.filter((m) => active === "all" || tagsFor(m).includes(active));

  return (
    <>
      <div className="feed-toolbar" role="group" aria-label="Filtrer les annonces">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`pill${active === f.key ? " active" : ""}`}
            onClick={() => setActive(f.key)}
          >
            {f.label}
            {f.key === "all" ? ` (${missions.length})` : ""}
          </button>
        ))}
      </div>

      <div className="job-list">
        {visible.map((mission) => (
          <JobCard key={mission.id} mission={mission} />
        ))}
      </div>

      {visible.length === 0 && (
        <p style={{ textAlign: "center", opacity: 0.6, padding: "60px 0" }}>
          Aucune mission ne correspond à ce filtre pour le moment.
        </p>
      )}
    </>
  );
}
