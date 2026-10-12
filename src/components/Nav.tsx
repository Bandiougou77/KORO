"use client";

import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  return (
    <nav>
      <div className="wrap">
        <Link href="/" className="logo">
          <span className="logo-mark"></span>Kôrô
        </Link>
        <div id="nav-links" className={menuOpen ? "nav-links open" : "nav-links"}>
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                style={active ? { opacity: 1 } : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="nav-right">
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
          <button
            type="button"
            className="nav-toggle"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            aria-controls="nav-links"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
