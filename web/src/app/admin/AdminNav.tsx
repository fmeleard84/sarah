"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/decks", label: "Decks et cartes" },
  { href: "/admin/arcanes", label: "Arcanes" },
  { href: "/admin/textes", label: "Textes et traductions" },
  { href: "/admin/utilisatrices", label: "Utilisatrices" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="no-scrollbar -mb-px flex gap-7 overflow-x-auto">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`label shrink-0 border-b-2 pb-3 pt-1 transition-colors ${active ? "border-slate text-ink" : "border-transparent text-ink-3 hover:text-ink"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
