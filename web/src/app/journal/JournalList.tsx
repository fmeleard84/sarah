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
      <header className="pt-6">
        <h1 className="display text-[44px]">{t.title}</h1>
      </header>
      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2" role="tablist">
        {(["week", "month", "all", "favorites"] as Tab[]).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`label shrink-0 border-b pb-1 ${tab === k ? "border-slate text-ink" : "border-transparent text-ink-3"}`}
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
        <ul className="mt-6">
          {shown.map((e) => (
            <li key={e.id} className="flex items-center gap-4 border-b border-rule py-4">
              <Link href={`/c/${e.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative h-[70px] w-[54px] shrink-0">
                  {e.images.slice(0, 3).map((src, i) => (
                    <div
                      key={i}
                      className="tarot absolute h-[64px] w-[43px]"
                      style={{ left: i * 5, top: i * -2, transform: `rotate(${i * 4}deg)`, zIndex: 3 - i }}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-ink-3">{fmt.format(new Date(e.createdAt))}</p>
                  <p className="title mt-0.5 line-clamp-2 text-[18px]">{e.title ?? t.untitled}</p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-2">
                    {e.names.slice(0, 2).join(" · ")}
                    {e.names.length > 2 ? ` ·+${e.names.length - 2}` : ""}
                  </p>
                </div>
              </Link>
              <button onClick={() => toggle(e)} aria-label={t.favorites} aria-pressed={e.favorite} className="p-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill={e.favorite ? "#C16780" : "none"} stroke={e.favorite ? "#C16780" : "#A39A92"} strokeWidth="1.5">
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
