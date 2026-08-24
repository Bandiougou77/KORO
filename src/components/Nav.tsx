"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";
import type { Role } from "@/generated/prisma/enums";

const links = [
  { href: "/offres", label: "Annonces" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/commission", label: "Commission" },
  { href: "/publier", label: "Entreprises" },
];

export function Nav({ session }: { session: { role: Role } | null }) {
  const pathname = usePathname();

  return (
    <nav>
      <div className="wrap">
        <Link href="/" className="logo">
          <span className="logo-mark"></span>Kôrô
        </Link>
        <div className="nav-links">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                style={active ? { opacity: 1 } : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="nav-cta">
          {session ? (
            <>
              <Link href={session.role === "entreprise" ? "/entreprise/dashboard" : "/moncompte"} className="btn btn-ghost">
                {session.role === "entreprise" ? "Dashboard entreprise" : "Mon compte"}
              </Link>
              <form action={logout}>
                <button type="submit" className="btn btn-dark">
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/connexion" className="btn btn-ghost">
                Connexion
              </Link>
              <Link href="/publier" className="btn btn-dark">
                Publier une mission
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
