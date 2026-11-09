"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { type Locale } from "@/lib/i18n";
import { useDict } from "@/components/I18nProvider";
import { MY_DECK_SIZE } from "@/lib/plans";
import { PlansSheet } from "@/components/PlansSheet";
import { Sheet } from "@/components/Sheet";
import { toast } from "@/components/Toast";
import { Tick } from "@/components/Tick";

export interface Version {
  id: string;
  arcana: number;
  image: string;
  deck: string;
}

export function MyDeckView(props: {
  locale: Locale;
  arcana: { number: number; numeral: string; name: string }[];
  versions: Version[];
  initial: Record<number, string>;
  active: boolean;
  canDraw: boolean;
}) {
  const t = useDict(props.locale).decks;
  const router = useRouter();
  const [picked, setPicked] = useState(props.initial);
  const [open, setOpen] = useState<number | null>(null);
  const [columns, setColumns] = useState<2 | 4>(2);
  const [active, setActive] = useState(props.active);
  const [plans, setPlans] = useState(false);

  const byId = useMemo(() => new Map(props.versions.map((v) => [v.id, v])), [props.versions]);
  const count = Object.keys(picked).length;
  const missing = MY_DECK_SIZE - count;
  const current = open === null ? null : props.arcana[open];

  async function choose(version: Version) {
    const res = await fetch("/api/my-deck", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cardId: version.id }) });
    if (!res.ok) return;
    setPicked((p) => ({ ...p, [version.arcana]: version.id }));
    setOpen(null);
    toast(t.toastAdded);
  }

  async function remove(arcana: number) {
    const res = await fetch("/api/my-deck", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ arcana }) });
    if (!res.ok) return;
    setPicked(({ [arcana]: _, ...rest }) => rest);
    setActive(false);
    setOpen(null);
    toast(t.toastRemoved);
  }

  async function draw() {
    if (!props.canDraw) return setPlans(true);
    if (missing > 0) return toast(t.incomplete(missing));
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ useMyDeck: true }) });
    if (res.status === 402) return setPlans(true);
    if (!res.ok) return;
    setActive(true);
    toast(t.toastMine);
    router.refresh();
  }

  return (
    <>
      <Link href="/decks" className="-ml-1 inline-flex h-10 items-center text-[26px] text-ink/70" aria-label="Retour">
        ‹
      </Link>
      <header className="mt-2">
        <h1 className="display text-[44px]">{t.myDeck}</h1>
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <p className="text-[13px] text-ink-3">{t.myDeckCount(count, MY_DECK_SIZE)}</p>
          <button onClick={() => setColumns(columns === 2 ? 4 : 2)} className="btn-link text-ink-3" style={{ fontSize: 14 }}>
            {t.columns(columns === 2 ? 4 : 2)}
          </button>
        </div>
        <p className="mt-4 text-[15px] text-ink-2">{t.myDeckHelp}</p>
      </header>

      <div className="mt-6">
        {active ? (
          <p className="label flex items-center gap-2 text-ink-3">
            <Tick /> {t.active}
          </p>
        ) : (
          <button onClick={draw} className="btn-primary w-full">
            {t.drawWithMine}
          </button>
        )}
        {!props.canDraw && <p className="mt-3 text-[13px] text-ink-3">{t.mineLocked}</p>}
        {props.canDraw && missing > 0 && <p className="mt-3 text-[13px] text-ink-3">{t.incomplete(missing)}</p>}
      </div>

      <ul className={`mt-8 grid gap-x-3 gap-y-5 ${columns === 2 ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6" : "grid-cols-4 md:grid-cols-6 lg:grid-cols-8"}`}>
        {props.arcana.map((a) => {
          const version = picked[a.number] ? byId.get(picked[a.number]) : undefined;
          return (
            <li key={a.number}>
              <button onClick={() => setOpen(a.number)} aria-label={a.name} className="block w-full text-left">
                {version ? (
                  <div className="tarot aspect-[2/3]">
                    <img src={version.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="flex aspect-[2/3] items-center justify-center border-[0.5px] border-dashed border-ink-3 text-[24px] text-ink-3" style={{ borderRadius: 2 }}>
                    +
                  </div>
                )}
                {columns === 2 && (
                  <p className="mt-1.5 text-[12px] text-ink-3">
                    {a.numeral} · {a.name}
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <Sheet open={open !== null} onClose={() => setOpen(null)}>
        {current && (
          <div className="pb-4">
            <h2 className="display text-[30px]">{`${current.numeral} · ${current.name}`}</h2>
            <p className="mt-2 text-[14px] text-ink-2">{t.pickVersion}</p>
            <ul className="mt-6 grid grid-cols-3 gap-3">
              {props.versions
                .filter((v) => v.arcana === current.number)
                .map((v) => (
                  <li key={v.id}>
                    <button onClick={() => choose(v)} aria-label={v.deck} aria-pressed={picked[current.number] === v.id} className="block w-full text-left">
                      <div className={`tarot aspect-[2/3] ${picked[current.number] === v.id ? "outline outline-2 outline-offset-1 outline-slate" : ""}`}>
                        <img src={v.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </div>
                      <p className="mt-1 text-[12px] text-ink-3">{v.deck}</p>
                    </button>
                  </li>
                ))}
            </ul>
            {picked[current.number] && (
              <button onClick={() => remove(current.number)} className="btn-link mt-6 text-ink-3">
                {t.removeFromMine}
              </button>
            )}
          </div>
        )}
      </Sheet>

      <PlansSheet locale={props.locale} open={plans} onClose={() => setPlans(false)} />
    </>
  );
}
