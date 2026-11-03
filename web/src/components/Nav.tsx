"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Locale } from "@/lib/i18n";
import { useDict } from "@/components/I18nProvider";

/**
 * Pill de navigation flottante, état A (menu général) : Tirer · Decks ·
 * Journal · Moi. Masquée pendant la révélation et la conversation.
 * L'icône active est pleine.
 */
export function Nav({ locale, initials }: { locale: Locale; initials: string }) {
  const t = useDict(locale).nav;
  const path = usePathname();
  const items = [
    { href: "/tirage", label: t.draw, icon: DrawIcon },
    { href: "/decks", label: t.decks, icon: DecksIcon },
    { href: "/journal", label: t.journal, icon: JournalIcon },
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
              <Link key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined} className="flex h-11 w-12 items-center justify-center text-canvas">
                <Icon filled={active} />
              </Link>
            );
          })}
          <Link href="/moi" aria-label={t.me} aria-current={meActive ? "page" : undefined} className="flex h-11 w-12 items-center justify-center">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border border-canvas text-[11px] font-medium uppercase ${
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
      <rect x="6" y="3" width="12" height="18" rx="1.5" />
    </svg>
  );
}

function DecksIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="24" height="22" viewBox="0 0 26 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="10" height="15" rx="1.5" transform="rotate(-10 8 12.5)" />
      <rect x="13" y="5" width="10" height="15" rx="1.5" transform="rotate(10 18 12.5)" />
      <rect x="8" y="3" width="10" height="16" rx="1.5" fill={filled ? "currentColor" : "#2C2825"} />
    </svg>
  );
}

function JournalIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" strokeLinejoin="round" />
    </svg>
  );
}
