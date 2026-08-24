import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "korosession";

function getSecretKey() {
  return new TextEncoder().encode(process.env.AUTH_SECRET!);
}

async function getSessionRole(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return (payload.role as string) ?? null;
  } catch {
    return null;
  }
}

// Confort de navigation uniquement : la vraie frontière de sécurité est dans
// chaque Server Action (requireRole + vérification de propriété).
export async function proxy(request: NextRequest) {
  const role = await getSessionRole(request);
  const { pathname } = request.nextUrl;

  if (!role) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/moncompte") && role !== "candidat") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/entreprise/dashboard") && role !== "entreprise") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/moncompte/:path*", "/entreprise/dashboard/:path*", "/admin/:path*"],
};
