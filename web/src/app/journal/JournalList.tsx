"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { type Locale } from "@/lib/i18n";
import { useDict } from "@/components/I18nProvider";

export interface Entry {
  id: string;
  title: string | null;
  favorite: boolean;
  createdAt: string;
  images: string[];
  names: string[];
  numbers: number[];
}

type Tab = "week" | "month" | "all" | "favorites";

export function JournalList({ locale, entries: initial }: { locale: Locale; entries: Entry[] }) {
  const t = useDict(locale).journal;
  const [tab, setTab] = useState<Tab>("all");
  const [entries, setEntries] = useState(initial);

  const shown = useMemo(() => {
    const now = Date.now();
    return entries.filter((e) => {
      const age = now - new Date(e.createdAt).getTime();
      if (tab === "week") return age < 7 * 86400_000;
      if (tab === "month") return age < 31 * 86400_000;
      if (tab === "favorites") return e.favorite;
      return true;
    });
  }, [entries, tab]);

  async function toggle(e: Entry) {
    setEntries((list) => list.map((x) => (x.id === e.id ? { ...x, favorite: !x.favorite } : x)));
    await fetch(`/api/conversations/${e.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ favorite: !e.favorite }) });
  }

  const fmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long" });

  return (
    <>
      <header className="pt-5">
        <h1 className="page-title">{t.title}</h1>
      </header>
      {/* Onglets : petites capitales, toujours sur une ligne, filet sous la rangée. */}
      <div className="no-scrollbar mt-[14px] flex gap-5 overflow-x-auto border-b border-rule" role="tablist" aria-label={t.title}>
        {(["week", "month", "all", "favorites"] as Tab[]).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`label -mb-px h-10 shrink-0 whitespace-nowrap ${tab === k ? "border-b-[1.5px] border-slate text-ink" : "text-ink-2"}`}
          >
            {t[k]}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="title text-[22px]">{t.empty}</p>
          <p className="mt-2 text-[14px] text-ink-2">{t.emptyBody}</p>
        </div>
      ) : (
        <ul className="mt-2">
          {shown.map((e) => (
            <li key={e.id} className="flex items-center gap-[18px] border-b border-rule py-[18px]">
              <Link href={`/c/${e.id}`} className="flex min-w-0 flex-1 items-center gap-[18px]">
                {e.images[0] && (
                  <img
                    src={e.images[0]}
                    alt=""
                    className="h-[66px] w-11 flex-none rounded-[3px] border border-bronze object-cover shadow-[0_6px_12px_-8px_rgba(60,40,20,0.4)]"
                  />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[12px] text-ink-2">{fmt.format(new Date(e.createdAt))}</span>
                  <span className="line-clamp-2 font-serif text-[21px] italic leading-6">{e.title ?? t.untitled}</span>
                  <span className="meta">
                    <span className="arcana text-[13px] text-ink">{e.names[0]}</span>
                    {"  ·  "}
                    <span className="whitespace-nowrap">
                      Nº <b className="tabnum">{e.numbers[0]}</b>
                    </span>
                    {e.names.length > 1 ? `  ·  +${e.names.length - 1}` : ""}
                  </span>
                </div>
              </Link>
              <button
                onClick={() => toggle(e)}
                aria-label={t.favorites}
                aria-pressed={e.favorite}
                className="flex h-11 w-11 flex-none items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={e.favorite ? "var(--color-rose)" : "none"} stroke={e.favorite ? "var(--color-rose)" : "var(--color-ink-2)"} strokeWidth="1.5">
                  <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
