"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Locale } from "@/lib/i18n";
import { useDict } from "@/components/I18nProvider";

/**
 * Pill de navigation flottante, état A (menu général) : Tirer · Journal ·
 * Decks · Moi. Masquée pendant la révélation et la conversation.
 * L'icône active est pleine.
 */
export function Nav({ locale, initials }: { locale: Locale; initials: string }) {
  const t = useDict(locale).nav;
  const path = usePathname();
  const items = [
    { href: "/tirage", label: t.draw, icon: DrawIcon },
    { href: "/journal", label: t.journal, icon: JournalIcon },
    { href: "/decks", label: t.decks, icon: DecksIcon },
  ];
  const meActive = path.startsWith("/moi");

  return (
    <>
      {/* Voile discret sous la pill, pour la détacher du contenu sans trait. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-28 bg-gradient-to-t from-canvas via-canvas/80 to-transparent" />
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="flex items-center gap-1 rounded-full bg-ink px-3 py-2 shadow-[0_12px_32px_-12px_rgba(44,40,37,0.5)]">
          {items.map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href);
            return (
              <Link key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined} className="flex h-12 w-14 items-center justify-center text-canvas">
                <Icon filled={active} />
              </Link>
            );
          })}
          <Link href="/moi" aria-label={t.me} aria-current={meActive ? "page" : undefined} className="flex h-12 w-14 items-center justify-center">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-canvas text-[12px] font-medium uppercase ${
                meActive ? "bg-canvas text-ink" : "text-canvas"
              }`}
            >
              {initials}
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}

function DrawIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4">
      <rect x="6" y="2.5" width="12" height="19" rx="1.5" />
    </svg>
  );
}

/** Trois cartes en éventail. Pleine, la carte de devant ressort sur celles de derrière. */
function DecksIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="30" height="28" viewBox="0 0 26 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <rect x="3.5" y="5" width="10" height="15" rx="1.5" fill="#2C2825" transform="rotate(-14 8.5 12.5)" />
      <rect x="8" y="4" width="10" height="15.5" rx="1.5" fill="#2C2825" transform="rotate(-2 13 12)" />
      <rect x="12.5" y="5" width="10" height="15" rx="1.5" fill={filled ? "currentColor" : "#2C2825"} transform="rotate(11 17.5 12.5)" />
    </svg>
  );
}

function JournalIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4">
      <path d="M6 4h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-7.5L6 21v-4a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" strokeLinejoin="round" />
    </svg>
  );
}
