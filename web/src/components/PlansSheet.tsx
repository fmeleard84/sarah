"use client";

import { useState } from "react";
import { DICTS, type Locale } from "@/lib/i18n";
import { PACKS, PLANS } from "@/lib/plans";
import { Sheet } from "@/components/Sheet";

/**
 * Paywall : Ritual mis en avant, puis Clarity, puis les cartes à l'unité.
 * Le paiement n'est pas encore branché : « Choisir » annonce l'ouverture.
 */
export function PlansSheet({ locale, open, onClose, current }: { locale: Locale; open: boolean; onClose: () => void; current?: string }) {
  return (
    <Sheet open={open} onClose={onClose}>
      <PlansContent locale={locale} onClose={onClose} current={current} />
    </Sheet>
  );
}

export function PlansContent({ locale, onClose, current }: { locale: Locale; onClose?: () => void; current?: string }) {
  const t = DICTS[locale].plans;
  const [notice, setNotice] = useState<string | null>(null);

  async function choose(item: string) {
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item }) });
    if (res.status === 501) setNotice(t.soon);
  }

  const paid = [PLANS.ritual, PLANS.clarity];
  return (
    <div>
      <h2 className="display text-[34px]">{t.title}</h2>
      <p className="mt-2 text-[14px] text-ink-2">{t.sub}</p>

      <div className="mt-8 space-y-4">
        {paid.map((p, i) => (
          <div key={p.id} className={`p-5 ${i === 0 ? "bg-surface" : "border border-rule"}`} style={{ borderRadius: 4 }}>
            <div className="flex items-baseline justify-between">
              <p className="title text-[24px]">{t.names[p.id]}</p>
              <p className="text-[15px]">
                {p.priceEur} €<span className="text-[12px] text-ink-3">{t.perMonth}</span>
              </p>
            </div>
            <ul className="mt-3 space-y-1 text-[14px] text-ink-2">
              {t.features[p.id].map((f) => (
                <li key={f}>{f}.</li>
              ))}
            </ul>
            {current === p.id ? (
              <p className="label mt-5 text-ink-3">{t.current}</p>
            ) : (
              <button onClick={() => choose(p.id)} className={`label mt-5 ${i === 0 ? "btn-primary w-full" : "btn-link text-slate"}`}>
                {t.choose}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {PACKS.map((pack) => (
          <button key={pack.id} onClick={() => choose(pack.id)} className="border border-rule p-4 text-left" style={{ borderRadius: 4 }}>
            <p className="title text-[20px]">{pack.id === "pack3" ? t.pack3 : t.single}</p>
            <p className="mt-1 text-[14px]">
              {pack.priceEur} € <span className="text-[12px] text-ink-3">{t.once}</span>
            </p>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-ink-3">{t.packHelp}</p>

      {notice && <p className="fade-up mt-6 bg-surface px-4 py-3 text-[13px]">{notice}</p>}

      {onClose && (
        <button onClick={onClose} className="label mt-8 block w-full py-2 text-center text-ink/40">
          {t.continue}
        </button>
      )}
    </div>
  );
}
