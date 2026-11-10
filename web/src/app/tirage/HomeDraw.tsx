"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type Locale } from "@/lib/i18n";
import { archMix } from "@/lib/arch";
import { useDict } from "@/components/I18nProvider";
import { toast } from "@/components/Toast";
import { Nav } from "@/components/Nav";
import { PlansSheet } from "@/components/PlansSheet";

interface DrawnCard {
  card: { arcana: number; image_path: string; arch_color: string | null; arch_intensity: number };
}

/** Durée de l'apparition (specs de Sarah du 9 novembre). */
const DUR = 1.6;

/**
 * Accueil de tirage (DA de Sarah du 9 novembre, handoff « Home + chat »).
 * Une arche faux blanc derrière le titre et la carte de dos, qui flotte. On
 * touche la carte : elle apparaît sur place comme une épreuve qui se développe,
 * l'arche prend la couleur de la carte, puis viennent le nom et « Révéler le
 * message. ». Une seule carte : les suivantes se tirent dans le chat.
 */
export function HomeDraw({
  locale,
  firstName,
  isAnonymous,
  trial,
  quota,
}: {
  locale: Locale;
  firstName: string | null;
  isAnonymous: boolean;
  trial: { plan: "exploration" | "early"; days: number } | null;
  quota: "day" | "week" | null;
}) {
  const t = useDict(locale);
  const router = useRouter();
  const [convId, setConvId] = useState<string | null>(null);
  const [drawn, setDrawn] = useState<DrawnCard["card"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState<null | { period: "day" | "week" }>(quota ? { period: quota } : null);
  const [plansOpen, setPlansOpen] = useState(false);
  const [names, setNames] = useState<Record<number, string>>({});
  // Le menu reste invisible à l'arrivée (specs) ; il revient après le tirage
  // ou au bout de quelques secondes, pour ne jamais enfermer la personne.
  const [navShown, setNavShown] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setNavShown(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch(`/api/arcana?locale=${locale}`)
      .then((r) => r.json())
      .then((list: { number: number; name: string }[]) => setNames(Object.fromEntries(list.map((a) => [a.number, a.name]))))
      .catch(() => {});
  }, [locale]);

  async function draw() {
    if (busy.current || drawn || blocked) return;
    busy.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spread: 1 }),
      });
      if (res.status === 402) {
        const body = await res.json();
        if (body.reason === "quota") setBlocked({ period: body.period });
        else toast(t.conv.errorBody);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const { id } = await res.json();
      const state = await fetch(`/api/conversations/${id}`).then((r) => r.json());
      const card = (state.cards as DrawnCard[])[0]?.card;
      if (!card) throw new Error("no card");
      // L'image est chargée avant l'apparition, pour que l'effet se voie en entier.
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => resolve();
        img.src = `${card.image_path}.webp`;
      });
      setConvId(id);
      setDrawn(card);
      setNavShown(true);
      navigator.vibrate?.(12);
    } catch {
      toast(t.conv.errorBody);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  const isDrawn = drawn !== null;
  const ease = "cubic-bezier(.22,.61,.36,1)";
  const name = drawn ? names[drawn.arcana] : "";

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {trial && (
        <Link
          href="/offres"
          className="relative z-10 flex h-[34px] items-center justify-center bg-canvas pt-[env(safe-area-inset-top)] text-[12px] text-ink-2"
        >
          {trial.plan === "early" ? t.home.early(trial.days) : t.home.exploration(trial.days)}
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="absolute right-[18px]">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      )}

      {/* L'arche : fixe, du haut de l'écran jusqu'à 32 px du bas, le bandeau passe par-dessus. */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 w-[calc(100%-32px)] max-w-[720px] -translate-x-1/2 rounded-b-[146px]"
        style={{
          height: "max(560px, calc(100dvh - 32px))",
          background: isDrawn ? archMix(drawn.arch_color, drawn.arch_intensity) : "var(--color-arch-idle)",
          transition: `background-color ${DUR}s cubic-bezier(.4,0,.2,1) .15s`,
        }}
      />

      <div className="relative px-8 md:px-[10%]" style={{ paddingTop: trial ? 30 : "max(44px, env(safe-area-inset-top))" }}>
        <p className="font-serif text-[16px] font-medium tracking-[0.06em]">MORNING · CARDS</p>
        <h1 className="page-title mt-[10px]">{t.home.hello(firstName)}</h1>
      </div>

      <div className="relative mt-10 flex justify-center">
        <div className={isDrawn || loading ? "" : "mc-float"} style={{ width: "min(249px, 64vw, calc((100dvh - 300px) * 0.662))", aspectRatio: "249 / 376" }}>
          <button
            type="button"
            onClick={draw}
            disabled={isDrawn || Boolean(blocked)}
            aria-label={isDrawn ? name : t.home.drawAria}
            className="relative block h-full w-full overflow-hidden rounded-[6px] border-[1.5px] border-bronze bg-surface shadow-[0_1px_2px_rgba(60,40,20,0.1),0_20px_36px_-14px_rgba(60,40,20,0.35)] disabled:cursor-default"
          >
            <img
              src="/brand/card-back.webp"
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                opacity: isDrawn ? 0 : 1,
                filter: isDrawn ? "blur(3px) brightness(1.15)" : loading ? "brightness(1.05)" : "none",
                transition: `opacity .6s cubic-bezier(.4,0,.2,1), filter .6s cubic-bezier(.4,0,.2,1)`,
              }}
            />
            {drawn && (
              <img
                key={drawn.image_path}
                src={`${drawn.image_path}.webp`}
                alt=""
                draggable={false}
                className="mc-develop absolute inset-0 h-full w-full object-cover"
              />
            )}
          </button>
        </div>
      </div>

      <div className="relative mt-[18px] min-h-16 px-8 text-center">
        {blocked ? (
          <div className="fade-up">
            <p className="text-[16px] leading-5 text-ink-2">{blocked.period === "week" ? t.plans.quotaReachedWeek : t.plans.quotaReached}</p>
            {isAnonymous ? (
              <Link href="/inscription" className="cta-text mt-1">
                <span>{t.wall.cta}</span>
              </Link>
            ) : (
              <button onClick={() => setPlansOpen(true)} className="cta-text mt-1">
                <span>{t.decks.seePlans}</span>
              </button>
            )}
          </div>
        ) : isDrawn ? (
          <div className="flex flex-col items-center" style={{ animation: `mc-fade .7s ${ease} ${(DUR * 0.8).toFixed(2)}s both` }}>
            <p className="arcana pl-[0.1em] text-[20px] leading-5 tracking-[0.1em]">{name}</p>
            <button onClick={() => convId && router.push(`/c/${convId}`)} className="cta-text">
              <span>{t.home.reveal}</span>
            </button>
          </div>
        ) : (
          <p className="text-[16px] leading-5 text-ink-2">{t.home.hold}</p>
        )}
      </div>

      {!isAnonymous && (
        <div className={`transition-opacity duration-700 ${navShown ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <Nav locale={locale} initials={(firstName?.trim()[0] ?? "·").toUpperCase()} />
        </div>
      )}
      <PlansSheet locale={locale} open={plansOpen} onClose={() => setPlansOpen(false)} />
    </div>
  );
}
