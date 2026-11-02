"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DICTS, type Locale } from "@/lib/i18n";
import { toast } from "@/components/Toast";
import { PlansSheet } from "@/components/PlansSheet";
import { Tick } from "@/components/Tick";

/** Définit le deck comme deck de tirage. Toast : « Tu tires avec X à partir de maintenant. » */
export function UseDeckButton({ locale, slug, name, active, locked }: { locale: Locale; slug: string; name: string; active: boolean; locked: boolean }) {
  const t = DICTS[locale].decks;
  const router = useRouter();
  const [isActive, setActive] = useState(active);
  const [plans, setPlans] = useState(false);

  async function use() {
    if (locked) return setPlans(true);
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mainDeck: slug }) });
    if (res.status === 402) return setPlans(true);
    if (res.ok) {
      setActive(true);
      toast(t.toastActive(name));
      router.refresh();
    }
  }

  return (
    <>
      {isActive ? (
        <p className="label flex items-center gap-2 text-ink-3"><Tick /> {t.active}</p>
      ) : (
        <button onClick={use} className="btn-primary label w-full">
          {t.drawWith}
        </button>
      )}
      {locked && <p className="mt-3 text-[13px] text-ink-3">{t.locked}</p>}
      <PlansSheet locale={locale} open={plans} onClose={() => setPlans(false)} />
    </>
  );
}
