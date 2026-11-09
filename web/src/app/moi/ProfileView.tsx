"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { type Locale } from "@/lib/i18n";
import { useDicts } from "@/components/I18nProvider";
import type { PlanId } from "@/lib/plans";
import { THEMES, type Theme } from "@/lib/theme";
import { toast } from "@/components/Toast";
import { PlansSheet } from "@/components/PlansSheet";

export interface Draw {
  arcana: number;
  name: string;
  image: string;
  href: string;
  date: string;
}

type Tab = "drawings" | "you" | "settings";
type Range = "month" | "year" | "all";
const WORLD = ["love", "work", "family", "health", "money", "growth"] as const;

export function ProfileView(props: {
  locale: Locale;
  email: string;
  isAdmin: boolean;
  firstName: string;
  birthdate: string;
  notifyEmail: boolean;
  plan: PlanId;
  hasBilling: boolean;
  lifePath: number | null;
  world: Record<string, string>;
  theme: Theme;
  stats: { cards: number; convs: number };
  draws: Draw[];
}) {
  const dicts = useDicts();
  const t = dicts[props.locale];
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("drawings");
  const [range, setRange] = useState<Range>("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ firstName: props.firstName, birthdate: props.birthdate, notifyEmail: props.notifyEmail, locale: props.locale });
  const [world, setWorld] = useState<Record<string, string>>(props.world);
  const [theme, setTheme] = useState(props.theme);
  const [plans, setPlans] = useState(false);

  const fmt = new Intl.DateTimeFormat(props.locale === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const top = useMemo(() => {
    const now = new Date();
    const tally = new Map<number, { draw: Draw; dates: string[] }>();
    for (const d of props.draws) {
      const when = new Date(d.date);
      if (range === "month" && (when.getMonth() !== now.getMonth() || when.getFullYear() !== now.getFullYear())) continue;
      if (range === "year" && when.getFullYear() !== now.getFullYear()) continue;
      const entry = tally.get(d.arcana) ?? { draw: d, dates: [] };
      entry.dates.push(d.date);
      tally.set(d.arcana, entry);
    }
    return [...tally.values()]
      .sort((a, b) => b.dates.length - a.dates.length)
      .slice(0, 5)
      .map((e) => ({ ...e, dates: e.dates.sort().reverse() }));
  }, [props.draws, range]);

  async function save() {
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, world }) });
    if (res.ok) {
      toast(dicts[form.locale].me.saved);
      router.refresh();
    }
  }

  async function chooseTheme(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: next }) });
  }

  async function manageBilling() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json().catch(() => ({ url: null }));
    if (url) window.location.href = url;
  }

  return (
    <>
      <header className="pt-6">
        <h1 className="display text-[44px]">{t.me.title}</h1>
        <p className="mt-2 text-[13px] text-ink-3">{t.me.stats(props.stats.cards, props.stats.convs)}</p>
      </header>

      <div className="hair-b mt-6 flex gap-6" role="tablist">
        {(["drawings", "you", "settings"] as Tab[]).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`label border-b pb-2 ${tab === k ? "border-slate text-ink" : "border-transparent text-ink-3"}`}>
            {t.me.tabs[k]}
          </button>
        ))}
      </div>

      {tab === "drawings" && (
        <section className="mt-6">
          <div className="flex gap-5">
            {(["month", "year", "all"] as Range[]).map((k) => (
              <button key={k} aria-pressed={range === k} onClick={() => setRange(k)} className={`label ${range === k ? "text-ink" : "text-ink-3"}`}>
                {t.me.ranges[k]}
              </button>
            ))}
          </div>
          <h2 className="title mt-6 text-[22px]">{t.me.mostDrawn}</h2>
          {top.length === 0 && <p className="mt-3 text-[14px] text-ink-2">{t.me.noDraw}</p>}
          <ul className="mt-4 space-y-5">
            {top.map(({ draw, dates }) => (
              <li key={draw.arcana} className="flex gap-4">
                <Link href={draw.href} className="tarot aspect-[2/3] w-20 shrink-0">
                  <img src={draw.image} alt={draw.name} className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0">
                  <p className="title text-[20px]">{draw.name}</p>
                  <p className="label mt-1 text-ink-3">× {dates.length}</p>
                  <ul className="mt-2 text-[13px] text-ink-2">
                    {(expanded === draw.arcana ? dates : dates.slice(0, 3)).map((d, i) => (
                      <li key={i}>{fmt.format(new Date(d))}</li>
                    ))}
                  </ul>
                  {dates.length > 3 && expanded !== draw.arcana && (
                    <button onClick={() => setExpanded(draw.arcana)} className="btn-link mt-1 text-ink-3" style={{ fontSize: 13 }}>
                      {t.me.seeMore}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "you" && (
        <section className="mt-6">
          <div className="bg-surface p-5" style={{ borderRadius: 4 }}>
            <p className="label text-ink-3">{t.me.lifePath}</p>
            {props.lifePath !== null && <p className="display mt-2 text-[56px] text-rose">{props.lifePath}</p>}
            <p className="mt-2 text-[13px] text-ink-2">{t.me.lifePathHelp}</p>
            <input className="field mt-2" type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} aria-label={t.wall.birthdate} />
          </div>

          <h2 className="title mt-8 text-[22px]">{t.me.worldTitle}</h2>
          <p className="mt-1 text-[14px] text-ink-2">{t.me.worldHelp}</p>
          <div className="mt-4 space-y-4">
            {WORLD.map((k) => (
              <label key={k} className="block">
                <span className="label text-ink-3">{t.me.world[k]}</span>
                <textarea
                  value={world[k] ?? ""}
                  onChange={(e) => setWorld({ ...world, [k]: e.target.value })}
                  maxLength={500}
                  rows={2}
                  className="field resize-none"
                  style={{ fieldSizing: "content" } as React.CSSProperties}
                />
              </label>
            ))}
          </div>
          <button onClick={save} className="btn-primary mt-6 w-full">
            {t.me.save}
          </button>
        </section>
      )}

      {tab === "settings" && (
        <>
          <section className="mt-6 space-y-2">
            <p className="label text-ink-3">{t.me.account}</p>
            <input className="field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder={t.wall.firstName} />
            <input className="field text-ink-3" value={props.email} disabled aria-label={t.wall.email} />
            <Link href="/mot-de-passe" className="btn-link block py-2 text-slate">
              {t.me.password}
            </Link>

            <div className="flex items-center justify-between border-b border-rule py-3">
              <span className="text-[15px]">{t.me.language}</span>
              <div className="flex gap-4">
                {(["fr", "en"] as Locale[]).map((l) => (
                  <button key={l} onClick={() => setForm({ ...form, locale: l })} className={`label ${form.locale === l ? "text-ink" : "text-ink-3"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule py-3">
              <span className="text-[15px]">{t.me.theme}</span>
              <div className="flex gap-4">
                {THEMES.map((k) => (
                  <button key={k} aria-pressed={theme === k} onClick={() => chooseTheme(k)} className={`label ${theme === k ? "text-ink" : "text-ink-3"}`}>
                    {t.me.themes[k]}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between gap-4 border-b border-rule py-3 text-[15px]">
              <span>{t.me.notifications}</span>
              <input type="checkbox" checked={form.notifyEmail} onChange={(e) => setForm({ ...form, notifyEmail: e.target.checked })} className="accent-slate" />
            </label>

            <button onClick={save} className="btn-primary mt-4 w-full">
              {t.me.save}
            </button>
          </section>

          <section className="mt-10 border-b border-rule py-3">
            <p className="label text-ink-3">{t.me.plan}</p>
            <div className="mt-1 flex items-baseline justify-between gap-4">
              <p className="title text-[22px]">{t.plans.names[props.plan]}</p>
              <button onClick={() => setPlans(true)} className="btn-link text-slate">
                {t.me.changePlan}
              </button>
            </div>
            {props.hasBilling && (
              <button onClick={manageBilling} className="btn-link mt-2 text-ink-3" style={{ fontSize: 14 }}>
                {t.me.manageBilling}
              </button>
            )}
          </section>

          <section className="mt-8">
            <p className="label text-ink-3">{t.me.support}</p>
            <a href="mailto:bonjour@vaya.rip" className="btn-link mt-2 inline-block text-slate">
              {t.me.contact}
            </a>
          </section>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <form action="/auth/logout" method="post">
              <button type="submit" className="border border-ink px-6 py-3 text-[15px] text-ink transition-colors hover:bg-ink hover:text-canvas">
                {t.auth.logout}
              </button>
            </form>
            {props.isAdmin && (
              <a href="/admin" className="btn-link text-slate">
                Administration
              </a>
            )}
          </div>
        </>
      )}

      <PlansSheet locale={props.locale} open={plans} onClose={() => setPlans(false)} current={props.plan} />
    </>
  );
}
