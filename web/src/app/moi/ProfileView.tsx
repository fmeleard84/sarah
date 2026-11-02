"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DICTS, type Locale } from "@/lib/i18n";
import type { PlanId } from "@/lib/plans";
import { toast } from "@/components/Toast";
import { PlansSheet } from "@/components/PlansSheet";

export function ProfileView(props: {
  locale: Locale;
  email: string;
  firstName: string;
  birthdate: string;
  notifyEmail: boolean;
  plan: PlanId;
  lifePath: number | null;
  stats: { cards: number; convs: number };
  top: { name: string; image: string; count: number }[];
}) {
  const t = DICTS[props.locale];
  const router = useRouter();
  const [form, setForm] = useState({ firstName: props.firstName, birthdate: props.birthdate, notifyEmail: props.notifyEmail, locale: props.locale });
  const [plans, setPlans] = useState(false);

  async function save() {
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      toast(DICTS[form.locale].me.saved);
      router.refresh();
    }
  }

  async function logout() {
    await createClient().auth.signOut();
    router.push("/bienvenue");
    router.refresh();
  }

  return (
    <>
      <header className="pt-6">
        <h1 className="display text-[44px]">{t.me.title}</h1>
        <p className="mt-2 text-[13px] text-ink-3">{t.me.stats(props.stats.cards, props.stats.convs)}</p>
      </header>

      {props.top.length > 0 && (
        <section className="mt-10">
          <h2 className="title text-[20px]">{t.me.mostDrawn}</h2>
          <div className="no-scrollbar -mx-[12.5%] mt-4 flex gap-3 overflow-x-auto px-[12.5%]">
            {props.top.map((c) => (
              <div key={c.name} className="w-24 shrink-0">
                <div className="tarot aspect-[2/3]">
                  <img src={c.image} alt="" className="h-full w-full object-cover" />
                </div>
                <p className="mt-1.5 text-[12px] text-ink-2">{c.name}</p>
                <p className="text-[11px] text-ink-3">× {c.count}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {props.lifePath !== null && (
        <section className="mt-10 bg-surface p-5" style={{ borderRadius: 4 }}>
          <p className="label text-ink-3">{t.me.lifePath}</p>
          <p className="display mt-2 text-[48px] text-rose">{props.lifePath}</p>
          <p className="text-[12px] text-ink-3">{t.me.lifePathHelp}</p>
        </section>
      )}

      <section className="mt-10 space-y-2">
        <p className="label text-ink-3">{t.me.account}</p>
        <input className="field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder={t.wall.firstName} />
        <input className="field text-ink-3" value={props.email} disabled />
        <input className="field" type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} aria-label={t.wall.birthdate} />

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

        <label className="flex items-center justify-between gap-4 border-b border-rule py-3 text-[15px]">
          <span>{t.me.notifications}</span>
          <input type="checkbox" checked={form.notifyEmail} onChange={(e) => setForm({ ...form, notifyEmail: e.target.checked })} className="accent-[#558BBB]" />
        </label>

        <button onClick={save} className="btn-primary label mt-4 w-full">
          {t.me.save}
        </button>
      </section>

      <section className="mt-10 flex items-center justify-between border-b border-rule py-3">
        <div>
          <p className="label text-ink-3">{t.me.plan}</p>
          <p className="title mt-1 text-[22px]">{t.plans.names[props.plan]}</p>
        </div>
        <button onClick={() => setPlans(true)} className="label btn-link text-slate">
          {t.me.changePlan}
        </button>
      </section>

      <button onClick={logout} className="label mt-10 text-ink/40">
        {t.auth.logout}
      </button>

      <PlansSheet locale={props.locale} open={plans} onClose={() => setPlans(false)} current={props.plan} />
    </>
  );
}
