import "server-only";
import { headers } from "next/headers";

// Méthode vérifiée dans la documentation officielle Vercel
// (vercel.com/docs/headers/request-headers, section x-forwarded-for) :
//
//   "The public IP address of the client that made the request. If you are trying to use
//   Vercel behind a proxy, we currently overwrite the X-Forwarded-For header and do not
//   forward external IPs. This restriction is in place to prevent IP spoofing."
//
// Un client ne peut donc PAS usurper cette valeur sur un plan Vercel standard — Vercel
// l'écrase systématiquement avec l'IP réelle. `x-vercel-forwarded-for` est décrit comme
// identique mais garanti même si un proxy est ajouté PAR-DESSUS Vercel (ex: Cloudflare
// devant Vercel) ; on le préfère donc en premier.
//
// LIMITE CONNUE (documentée par Vercel) : cette confiance suppose qu'aucun "Trusted Proxy"
// Enterprise personnalisé n'est activé sur le projet — cette fonctionnalité permet
// explicitement de fournir sa propre valeur de X-Forwarded-For, ce qui casserait cette
// hypothèse. Kôrô n'utilise pas cette fonctionnalité au moment où ce commentaire est écrit.
// À revérifier si le plan Vercel change ou si un proxy est ajouté devant Vercel sans relire
// cette documentation.
export async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  const brut = hdrs.get("x-vercel-forwarded-for") ?? hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip");
  if (!brut) return "ip-inconnue";

  // Défensif seulement : sur un plan standard cette valeur est une IP unique, pas une liste.
  const segments = brut.split(",").map((s) => s.trim()).filter(Boolean);
  return segments[segments.length - 1] ?? "ip-inconnue";
}
