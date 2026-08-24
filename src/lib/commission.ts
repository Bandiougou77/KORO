import { db } from "@/lib/db";
import type { DureeType } from "@/generated/prisma/enums";

export { calculerRepartition } from "@/lib/repartition";

export async function getTauxCommission(paysId: string, dureeType: DureeType): Promise<number> {
  const config = await db.configCommission.findFirst({
    where: { paysId, dureeType, dateEffective: { lte: new Date() } },
    orderBy: { dateEffective: "desc" },
  });
  if (!config) {
    throw new Error(`Aucune configuration de commission pour ce pays (${dureeType})`);
  }
  return config.taux;
}
