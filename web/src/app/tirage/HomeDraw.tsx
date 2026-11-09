"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Locale } from "@/lib/i18n";
import { useDict } from "@/components/I18nProvider";
import { toast } from "@/components/Toast";
import { PlansSheet } from "@/components/PlansSheet";

interface DrawnCard {
  position: number;
  card: { arcana: number; image_path: string; decks?: { name: string } };
}

const HOLD_MS = 1200;

/**
 * Tirage sur l'accueil. La pile de cartes de dos ; toucher maintenu sur la
 * carte du dessus, révélation en 1,2 s par dissolution depuis le centre
 * (inspiration : la photo qui se développe). Si le doigt se lève, l'effet
 * s'arrête. Pour 3 ou 5 cartes, la suivante monte après chaque révélation.
 */
export function HomeDraw({
  locale,
  firstName,
  deckName,
  spreads,
  isAnonymous,
  trial,
  quota,
}: {
  locale: Locale;
  firstName: string | null;
  deckName: string;
  spreads: (1 | 3 | 5)[];
  isAnonymous: boolean;
  trial: { plan: "exploration" | "early"; days: number } | null;
  quota: "day" | "week" | null;
}) {
  const t = useDict(locale);
  const router = useRouter();
  const [spread, setSpread] = useState<1 | 3 | 5>(1);
  const [convId, setConvId] = useState<string | null>(null);
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [transition, setTransition] = useState(false);
  const [blocked, setBlocked] = useState<null | { period: "day" | "week" }>(quota ? { period: quota } : null);
  const [plansOpen, setPlansOpen] = useState(false);
  const [names, setNames] = useState<Record<number, string>>({});

  const holding = useRef(false);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);
  const starting = useRef<Promise<void> | null>(null);
  const ready = useRef(false);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIdle(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch(`/api/arcana?locale=${locale}`)
      .then((r) => r.json())
      .then((list: { number: number; numeral: string; name: string }[]) =>
        setNames(Object.fromEntries(list.map((a) => [a.number, `${a.numeral} · ${a.name}`]))),
      )
      .catch(() => {});
  }, [locale]);

  const start = useCallback(async () => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spread }),
    });
    if (res.status === 402) {
      const body = await res.json();
      if (body.reason === "quota") setBlocked({ period: body.period });
      else if (body.reason === "spread") toast(t.home.lockedSpread);
      throw new Error("refused");
    }
    if (!res.ok) throw new Error(String(res.status));
    const { id } = await res.json();
    const state = await fetch(`/api/conversations/${id}`).then((r) => r.json());
    setConvId(id);
    setCards(state.cards);
    ready.current = true;
  }, [spread, t]);

  const tick = useCallback((now: number) => {
    const dt = now - last.current;
    last.current = now;
    // Tant que le tirage n'est pas revenu du serveur, on plafonne avant la fin.
    setProgress((p) => Math.min(ready.current ? 1 : 0.92, p + dt / HOLD_MS));
    if (holding.current) raf.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (progress >= 1 && !revealed.includes(current)) {
      holding.current = false;
      if (raf.current) cancelAnimationFrame(raf.current);
      setRevealed((r) => [...r, current]);
      navigator.vibrate?.(12);
    }
  }, [progress, current, revealed]);

  function onDown(e: React.PointerEvent) {
    if (revealed.includes(current) || blocked) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    holding.current = true;
    last.current = performance.now();
    if (!convId && !starting.current) {
      starting.current = start().catch(() => {
        holding.current = false;
        setProgress(0);
        starting.current = null;
      });
    }
    raf.current = requestAnimationFrame(tick);
  }

  function onUp() {
    holding.current = false;
    if (raf.current) cancelAnimationFrame(raf.current);
  }

  function next() {
    setCurrent((c) => c + 1);
    setProgress(0);
  }

  function open() {
    if (!convId) return;
    setTransition(true);
    setTimeout(() => router.push(`/c/${convId}`), 1500);
  }

  const total = convId ? cards.length : spread;
  const isRevealed = revealed.includes(current);
  const allRevealed = convId !== null && revealed.length === cards.length;
  const front = cards[current]?.card;
  const radius = progress * 75;

  if (transition) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate" onClick={() => convId && router.push(`/c/${convId}`)}>
        <p className="display fade-up text-[30px] text-canvas">{t.home.transition}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-180px)] flex-col">
      {trial && (
        <Link href="/offres" className="-mx-[12.5%] mb-2 flex h-9 items-center justify-between bg-surface px-[12.5%] text-[12px] text-ink/80">
          <span className="flex-1 text-center">{trial.plan === "early" ? t.home.early(trial.days) : t.home.exploration(trial.days)}</span>
          <span className="text-ink/40">›</span>
        </Link>
      )}

      <header className="pt-4">
        <div className="flex items-center justify-between gap-4">
          <img src="/brand/wordmark.svg" alt="Morning Cards" className="h-[10px] w-auto opacity-90" />
          <p className="label text-ink-3">{deckName}</p>
        </div>
        <h1 className="display mt-6 text-[48px]">{t.home.hello(firstName)}</h1>
        <p className="mt-2 text-[16px] text-ink-2">{t.home.rhythm[spread]}</p>
      </header>

      {!convId && (
        <div className="mt-6 flex gap-6" role="tablist">
          {([1, 3, 5] as const).map((n) => {
            const allowed = spreads.includes(n);
            return (
              <button
                key={n}
                role="tab"
                aria-selected={spread === n}
                onClick={() => (allowed ? setSpread(n) : toast(t.home.lockedSpread))}
                className={`label border-b pb-1 transition-colors ${
                  spread === n ? "border-slate text-ink" : "border-transparent text-ink-3"
                } ${allowed ? "" : "opacity-50"}`}
              >
                {t.home.spread(n)}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative mx-auto mt-7 w-[58%] max-w-[260px]">
        {/* Les cartes suivantes, décalées derrière comme le pictogramme. */}
        {Array.from({ length: Math.max(0, total - current - 1) })
          .slice(0, 4)
          .map((_, i) => (
            <div
              key={i}
              className="tarot absolute inset-0 aspect-[2/3]"
              style={{ transform: `translate(${(i + 1) * 7}px, ${(i + 1) * -6}px) rotate(${(i + 1) * 2.5}deg)`, zIndex: 4 - i }}
            >
              <img src="/brand/card-back.webp" alt="" className="h-full w-full object-cover" />
            </div>
          ))}

        <div
          className="tarot relative z-10 aspect-[2/3] touch-none select-none"
          style={{ animation: idle && progress === 0 && !isRevealed ? "pulse-card 2.4s ease-in-out infinite" : undefined }}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          {front && <img src={`${front.image_path}.webp`} alt={names[front.arcana] ?? ""} className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
          {!isRevealed && (
            <img
              src="/brand/card-back.webp"
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
              style={
                progress > 0
                  ? {
                      WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent ${radius}%, rgba(0,0,0,.6) ${radius + 6}%, black ${radius + 14}%)`,
                      maskImage: `radial-gradient(circle at 50% 50%, transparent ${radius}%, rgba(0,0,0,.6) ${radius + 6}%, black ${radius + 14}%)`,
                      filter: `sepia(${progress * 0.6}) brightness(${1 + progress * 0.15})`,
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>

      <div className="mt-6 min-h-[96px] text-center">
        {blocked ? (
          <div className="fade-up">
            <p className="title text-[22px]">{blocked.period === "week" ? t.plans.quotaReachedWeek : t.plans.quotaReached}</p>
            {isAnonymous ? (
              <Link href="/inscription" className="btn-primary label mt-6">
                {t.wall.cta}
              </Link>
            ) : (
              <>
                <p className="mt-2 text-[14px] text-ink-2">{t.plans.quotaBody}</p>
                <button onClick={() => setPlansOpen(true)} className="label btn-link mt-5 text-slate">
                  {t.decks.seePlans}
                </button>
              </>
            )}
          </div>
        ) : isRevealed && front ? (
          <div className="fade-up">
            <p className="display text-[28px]">{names[front.arcana]}</p>
            {front.decks?.name && <p className="label mt-2 text-ink-3">{front.decks.name}</p>}
            {current < cards.length - 1 ? (
              <button onClick={next} className="btn-primary mt-5">
                {t.home.next}
              </button>
            ) : (
              allRevealed && (
                <button onClick={open} className="btn-primary mt-5">
                  {t.home.reveal}
                </button>
              )
            )}
          </div>
        ) : (
          <>
            <p className="text-[13px] text-ink-3">{t.home.hold}</p>
            {total > 1 && convId && <p className="mt-1 text-[12px] text-ink-3">{`${current + 1} / ${total}`}</p>}
          </>
        )}
      </div>

      <PlansSheet locale={locale} open={plansOpen} onClose={() => setPlansOpen(false)} />
    </div>
  );
}
