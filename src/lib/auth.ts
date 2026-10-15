import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

const COOKIE_NAME = "korosession";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 jours

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manquant dans l'environnement");
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { userId: string; role: Role; tokenVersion: number };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, role: Role, tokenVersion: number): Promise<void> {
  const token = await new SignJWT({ userId, role, tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      userId: payload.userId as string,
      role: payload.role as Role,
      tokenVersion: (payload.tokenVersion as number) ?? 0,
    };
  } catch {
    return null;
  }
}

export class AuthError extends Error {}

// Frontière de sécurité réelle (voir proxy.ts) : en plus du rôle, revérifie en base que le
// JWT n'a pas été révoqué (reset de mot de passe -> tokenVersion incrémenté) et que le compte
// n'a pas été suspendu depuis l'émission du cookie — un JWT autonome de 7 jours ne le saurait
// pas sinon.
export async function requireRole(role: Role): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError("Vous devez être connecté.");
  if (session.role !== role) throw new AuthError("Accès non autorisé pour ce rôle.");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { tokenVersion: true, compteSuspendu: true },
  });
  if (!user || user.tokenVersion !== session.tokenVersion) {
    throw new AuthError("Votre session a expiré, veuillez vous reconnecter.");
  }
  if (user.compteSuspendu) {
    throw new AuthError("Ce compte est suspendu le temps d'un examen. Contactez le support.");
  }

  return session;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
