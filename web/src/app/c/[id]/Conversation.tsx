"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { type Locale } from "@/lib/i18n";
import { archMix } from "@/lib/arch";
import { useDict } from "@/components/I18nProvider";
import { ANONYMOUS_USER_MESSAGES } from "@/lib/plans";
import { Picto } from "@/components/Picto";
import { PlansSheet } from "@/components/PlansSheet";
import { Sheet } from "@/components/Sheet";
import { SignupForm } from "@/components/SignupForm";

const DRAW_TOKEN = "[[DRAW_CARD]]";

interface Card {
  position: number;
  is_extra: boolean;
  card: { id: string; arcana: number; image_path: string; arch_color: string | null; arch_intensity: number; decks: { name: string } };
}
interface Message {
  id: string;
  role: "user" | "assistant";
  kind: "text" | "reveal";
  card_position: number | null;
  content: string;
}

const noSubscribe = () => () => {};
function periodOf(iso: string) {
  const created = new Date(iso);
  if (created.toDateString() !== new Date().toDateString()) return null;
  const h = created.getHours();
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}

/** Retire les jetons techniques et les tirets cadratins pendant l'affichage. */
const display = (s: string) => s.replace(DRAW_TOKEN, "").replace("[[ERROR]]", "").replace(/\s*—\s*/g, ", ").replace(/\*/g, "").trim();

export function Conversation({
  id,
  locale,
  isAnonymous,
  initialCards,
  initialMessages,
  names,
  myDeck,
  createdAt,
}: {
  id: string;
  locale: Locale;
  isAnonymous: boolean;
  initialCards: Card[];
  initialMessages: Message[];
  names: Record<number, { numeral: string; name: string }>;
  myDeck: boolean;
  createdAt: string;
}) {
  const t = useDict(locale);
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [messages, setMessages] = useState(initialMessages);
  const [streaming, setStreaming] = useState<null | { kind: "text" | "reveal"; position: number | null; text: string }>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  /** En-tête replié dès que la conversation défile (specs du 9 novembre). */
  const [compact, setCompact] = useState(false);
  /** Cartes tirées pendant cette visite : seules elles jouent l'apparition. */
  const [fresh, setFresh] = useState<number[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [plans, setPlans] = useState(false);
  const [wall, setWall] = useState(false);
  /** Inscription proposée sans bloquer, avant le mur du 3e message. */
  const [keep, setKeep] = useState(false);
  const [anon, setAnon] = useState(isAnonymous);
  const [zoom, setZoom] = useState<Card | null>(null);
  const [offer, setOffer] = useState<null | "early" | "exploration">(null);
  const scroller = useRef<HTMLElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const spacer = useRef<HTMLDivElement>(null);
  const anchorNext = useRef(false);
  const busy = useRef(false);
  /** Message envoyé juste avant le mur d'inscription, transmis une fois le compte créé. */
  const pending = useRef<string | null>(null);

  const userCount = messages.filter((m) => m.role === "user").length;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const suggestsCard = !streaming && lastAssistant?.content.includes(DRAW_TOKEN);

  // Reprise d'une conversation : on arrive sur la fin du fil.
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, []);

  // L'en-tête se replie au-delà de 60 px de défilement et redevient grand tout en haut.
  function onScroll(e: React.UIEvent<HTMLElement>) {
    const top = e.currentTarget.scrollTop;
    if (top > 60 && !compact) setCompact(true);
    else if (top < 8 && compact) setCompact(false);
  }

  // Lecture ancrée : le message envoyé (ou la carte ajoutée) monte en haut de l'écran,
  // la réponse s'écrit dessous et rien ne bouge ensuite. La personne descend à son
  // rythme. La cale laisse la place de remonter l'ancre tant que le texte est court.
  useLayoutEffect(() => {
    const main = scroller.current;
    const start = anchor.current;
    const end = spacer.current;
    if (!main || !start || !end) return;
    const reach = end.getBoundingClientRect().top - start.getBoundingClientRect().top;
    end.style.height = `${Math.max(0, main.clientHeight - reach - 32)}px`;
    if (anchorNext.current) {
      anchorNext.current = false;
      start.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  /** Lit le flux de l'IA et l'affiche au fil de l'eau. */
  const run = useCallback(
    async (body: object, kind: "text" | "reveal", position: number | null) => {
      busy.current = true;
      setError(false);
      setStreaming({ kind, position, text: "" });
      try {
        const res = await fetch(`/api/conversations/${id}/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.status === 402) {
          const r = await res.json();
          if (r.reason === "signup_required") setWall(true);
          setStreaming(null);
          return;
        }
        if (!res.ok || !res.body) throw new Error(String(res.status));
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setStreaming({ kind, position, text });
        }
        if (text.includes("[[ERROR]]")) throw new Error("llm");
        const state = await fetch(`/api/conversations/${id}`).then((r) => r.json());
        setMessages(state.messages);
        setCards(state.cards);
      } catch {
        setError(true);
      } finally {
        setStreaming(null);
        busy.current = false;
      }
    },
    [id],
  );

  // Accueille, dans l'ordre, chaque carte qui n'a pas encore son texte.
  useEffect(() => {
    if (busy.current || streaming || error) return;
    const done = new Set(messages.filter((m) => m.kind === "reveal").map((m) => m.card_position));
    const next = cards.find((c) => !done.has(c.position));
    if (next) {
      anchorNext.current = next.is_extra;
      run({ reveal: next.position }, "reveal", next.position);
    }
  }, [cards, messages, streaming, error, run]);

  async function send() {
    const text = input.trim();
    if (!text || busy.current) return;
    setInput("");
    anchorNext.current = true;
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: "user", kind: "text", card_position: null, content: text }]);
    // Onboarding : les deux premières réponses sont offertes, le compte est demandé
    // à l'envoi du message suivant, qui part une fois le compte créé.
    if (anon && userCount >= ANONYMOUS_USER_MESSAGES) {
      pending.current = text;
      setWall(true);
      return;
    }
    await run({ message: text }, "text", null);
  }

  async function drawCard() {
    if (drawing || busy.current) return;
    setDrawing(true);
    try {
      const res = await fetch(`/api/conversations/${id}/cards`, { method: "POST" });
      if (res.status === 402) {
        const r = await res.json();
        if (r.reason === "signup_required") setWall(true);
        else setPlans(true);
        return;
      }
      if (!res.ok) return setError(true);
      const state = await fetch(`/api/conversations/${id}`).then((r) => r.json());
      const known = new Set(cards.map((c) => c.position));
      setFresh((f) => [...f, ...(state.cards as Card[]).filter((c) => !known.has(c.position)).map((c) => c.position)]);
      setCards(state.cards);
    } finally {
      setDrawing(false);
    }
  }

  function onSignedUp(plan: "early" | "exploration") {
    setAnon(false);
    setWall(false);
    setKeep(false);
    setOffer(plan);
  }

  // Le rafraîchissement (session devenue un compte) attend la fermeture de
  // l'offre : lancé plus tôt, il remontait l'écran sous le bouton.
  function closeOffer() {
    setOffer(null);
    router.refresh();
    const text = pending.current;
    pending.current = null;
    if (text) run({ message: text }, "text", null);
  }

  const name = (c: Card) => names[c.card.arcana];
  const lastUserId = [...messages].reverse().find((m) => m.role === "user")?.id;
  const anchorOnReveal = streaming?.kind === "reveal" && streaming.position !== null && cards[streaming.position]?.is_extra;

  // En-tête « colophon » : teinte de la première carte, gardée toute la conversation ;
  // pile des trois dernières vignettes, nom de la dernière carte.
  const first = cards[0];
  const last = cards[cards.length - 1];
  const tint = first ? archMix(first.card.arch_color, first.card.arch_intensity) : "var(--color-arch-idle)";
  const pile = cards.slice(-3);
  const layouts: Record<number, [number, number][]> = { 1: [[26, 0]], 2: [[14, -7], [38, 4]], 3: [[4, -9], [26, -1], [48, 7]] };
  const layoutsSmall: Record<number, [number, number][]> = { 1: [[10, 0]], 2: [[4, -7], [16, 4]], 3: [[0, -9], [10, -1], [20, 7]] };
  const deckLine = (c: Card) => (myDeck ? t.conv.myDeck : t.conv.deckLine(c.card.decks.name));
  // « ce matin », « ce soir » : à l'heure de la personne, donc calculé dans le navigateur seulement.
  const period = useSyncExternalStore(noSubscribe, () => periodOf(createdAt), () => null);
  const metaTail = cards.length > 1 ? t.conv.cardsLine(cards.length, period) : last ? deckLine(last) : "";
  const meta = (c: Card | undefined, tail: string) =>
    c ? (
      <>
        Nº <b className="tabnum">{c.card.arcana}</b>
        {tail ? ` · ${tail}` : ""}
      </>
    ) : null;

  const reveals = new Set(messages.filter((m) => m.kind === "reveal").map((m) => m.card_position));
  /** Planche hors texte : la carte supplémentaire dans le fil, entre deux filets. */
  const plate = (c: Card, anchored = false) => {
    const animate = fresh.includes(c.position);
    return (
      <figure
        key={`plate-${c.position}`}
        ref={anchored ? anchor : undefined}
        className="hair-t hair-b mt-[34px] flex scroll-mt-[90px] flex-col items-center pb-[22px] pt-[26px]"
      >
        <button
          onClick={() => setZoom(c)}
          className={`${animate ? "mc-develop " : ""}h-[199px] w-[132px] overflow-hidden rounded-[4px] border border-bronze shadow-[0_1px_2px_rgba(60,40,20,0.1),0_16px_28px_-14px_rgba(60,40,20,0.4)]`}
        >
          <img src={`${c.card.image_path}.webp`} alt={name(c)?.name} className="h-full w-full object-cover" />
        </button>
        <figcaption className={`${animate ? "mc-in " : ""}mt-[14px] flex flex-col items-center gap-[5px]`}>
          <span className="arcana text-[20px]">{name(c)?.name}</span>
          <span className="meta">{meta(c, myDeck ? t.conv.myDeck : t.conv.deckLine(c.card.decks.name))}</span>
        </figcaption>
      </figure>
    );
  };
  const revealText = (text: string, extra: boolean, animate: boolean) => (
    <p data-role="reveal" className={`${extra ? "mt-[22px]" : ""} ${animate ? "mc-in2" : "fade-up"} whitespace-pre-line font-serif text-[20px] italic leading-7`}>{display(text)}</p>
  );
  const busyNow = Boolean(streaming) || drawing;

  return (
    <div className="relative flex h-dvh flex-col">
      {/* En-tête fixe, la conversation défile dessous. */}
      <header
        className="absolute inset-x-0 top-0 z-20 shadow-[0_10px_18px_-16px_rgba(60,40,20,0.35)] transition-[border-radius] duration-300"
        style={{ background: tint, borderRadius: compact ? "0 0 120px 120px / 0 0 14px 14px" : "0 0 120px 120px / 0 0 28px 28px" }}
      >
        {!anon && (
          <Link
            href="/journal"
            aria-label={t.conv.back}
            className="absolute left-2 z-10 flex h-11 w-8 items-center justify-center text-ink-2"
            style={{ top: compact ? "calc(env(safe-area-inset-top) + 13px)" : "calc(env(safe-area-inset-top) + 14px)" }}
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </Link>
        )}
        {compact ? (
          <div key="small" className="fade-up flex h-[70px] items-center justify-center gap-3 px-12" style={{ marginTop: "env(safe-area-inset-top)", animationDuration: ".4s" }}>
            <button onClick={() => last && setZoom(last)} aria-label={last ? name(last)?.name : undefined} className="relative h-[42px] w-12 flex-none">
              {pile.map((c, i) => (
                <img
                  key={c.position}
                  src={`${c.card.image_path}-sm.webp`}
                  alt=""
                  className="absolute top-0 h-[42px] w-7 rounded-[2px] border border-bronze object-cover shadow-[0_4px_8px_-6px_rgba(60,40,20,0.45)]"
                  style={{ left: layoutsSmall[pile.length][i][0], transform: `rotate(${layoutsSmall[pile.length][i][1]}deg)` }}
                />
              ))}
            </button>
            <div className="flex min-w-0 flex-col gap-[3px]">
              <span className="arcana truncate text-[17px] leading-[1.1]">{last && name(last)?.name}</span>
              <span className="meta truncate">{meta(last, metaTail)}</span>
            </div>
          </div>
        ) : (
          <div key="big" className="fade-up flex flex-col items-center px-7 pb-[22px] pt-[18px]" style={{ marginTop: "env(safe-area-inset-top)", animationDuration: ".4s" }}>
            <button onClick={() => last && setZoom(last)} aria-label={last ? name(last)?.name : undefined} className="relative h-[66px] w-24">
              {pile.map((c, i) => (
                <img
                  key={c.position}
                  src={`${c.card.image_path}-sm.webp`}
                  alt=""
                  className="absolute top-0 h-[66px] w-11 rounded-[3px] border border-bronze object-cover shadow-[0_6px_12px_-8px_rgba(60,40,20,0.45)]"
                  style={{ left: layouts[pile.length][i][0], transform: `rotate(${layouts[pile.length][i][1]}deg)` }}
                />
              ))}
            </button>
            <span className="arcana mt-[10px] max-w-[310px] text-center text-[20px] leading-[1.2]">{last && name(last)?.name}</span>
            <span className="meta mt-[5px] whitespace-nowrap">{meta(last, metaTail)}</span>
          </div>
        )}
      </header>

      <main
        ref={scroller}
        onScroll={onScroll}
        className="no-scrollbar flex-1 overflow-y-auto px-7 pb-8 md:px-[10%]"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 182px)" }}
      >
        <div className="mx-auto max-w-[680px]">
          {messages.map((m, idx) => {
            if (m.kind === "reveal") {
              const c = cards.find((k) => k.position === m.card_position);
              const extra = Boolean(c?.is_extra);
              return (
                <div key={m.id}>
                  {c && extra && plate(c)}
                  {revealText(m.content, extra, false)}
                </div>
              );
            }
            if (m.role === "user") {
              return (
                <div
                  key={m.id}
                  data-role="user"
                  ref={m.id === lastUserId && !anchorOnReveal ? anchor : undefined}
                  className="ml-7 mt-[26px] scroll-mt-[90px] border-l border-rule-msg pl-4"
                >
                  <span className="text-[10px] uppercase tracking-[0.18em] text-ink-2">{t.conv.youLabel}</span>
                  <p className="mt-[6px] whitespace-pre-line text-[16px] leading-[25px]">{m.content}</p>
                </div>
              );
            }
            return (
              <p key={m.id} data-role="assistant" className={`${messages[idx - 1]?.kind === "reveal" ? "mt-[14px]" : "mt-[26px]"} whitespace-pre-line text-[16px] leading-[25px]`}>
                {display(m.content)}
              </p>
            );
          })}

          {/* Cartes supplémentaires dont le texte n'est pas encore arrivé. */}
          {cards
            .filter((c) => c.is_extra && !reveals.has(c.position))
            .map((c) => (
              <div key={`pending-${c.position}`}>
                {plate(c, anchorOnReveal && streaming?.position === c.position)}
                {streaming?.kind === "reveal" && streaming.position === c.position && streaming.text !== "" && revealText(streaming.text, true, true)}
              </div>
            ))}

          {streaming && (
            <div data-role="streaming" className="mb-2">
              {streaming.text !== "" &&
                (streaming.kind === "reveal"
                  ? !cards[streaming.position ?? 0]?.is_extra && revealText(streaming.text, false, false)
                  : <p className="mt-[26px] whitespace-pre-line text-[16px] leading-[25px]">{display(streaming.text)}</p>)}
              {/* Le picto reste sous le texte, que la réponse pousse vers le bas. */}
              <div className="flex justify-center py-4">
                <Picto size={40} animated />
              </div>
            </div>
          )}

          {error && (
            <div className="fade-up my-8 text-center">
              <p className="title text-[22px]">{t.conv.error}</p>
              <p className="mt-2 text-[14px] text-ink-2">{t.conv.errorBody}</p>
              <button onClick={() => setError(false)} className="btn-primary mt-6">
                {t.conv.retry}
              </button>
            </div>
          )}

          {suggestsCard && (
            <div className="fade-up mt-6 flex justify-center">
              <button onClick={drawCard} disabled={busyNow} className="cta-text disabled:opacity-50">
                <span>{t.conv.drawAnother}</span>
              </button>
            </div>
          )}
          <div ref={spacer} aria-hidden="true" />
        </div>
      </main>

      {/* Bas d'écran : le champ, puis « Tirer une carte » en permanence. */}
      {!wall && (
        <footer className="hair-t bg-canvas px-7 pb-[max(env(safe-area-inset-bottom),10px)] pt-3 md:px-[10%]">
          <div className="mx-auto max-w-[680px]">
            <div className="flex items-end gap-3">
              <label htmlFor="mc-msg" className="sr-only">
                {t.conv.placeholder}
              </label>
              <textarea
                id="mc-msg"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={t.conv.placeholder}
                className="max-h-40 min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-[16px] outline-none placeholder:text-ink-2/70"
                style={{ fieldSizing: "content" } as React.CSSProperties}
              />
              {input.trim() && (
                <button onClick={send} disabled={Boolean(streaming)} aria-label="Envoyer" className="h-9 px-1 text-[28px] leading-none text-slate disabled:opacity-40">
                  ›
                </button>
              )}
            </div>
            {/* Sans compte : rappel discret que l'échange sera perdu, dès la première lecture. */}
            {anon && !streaming && messages.some((m) => m.role === "assistant") && (
              <p className="pt-1 text-[13px] text-ink-2">
                {t.conv.notSaved}{" "}
                <button onClick={() => setKeep(true)} className="btn-link text-[13px]">
                  {t.conv.keepIt}
                </button>
              </p>
            )}
            <button onClick={drawCard} disabled={busyNow} className="mt-1 flex h-11 items-center text-[14px] disabled:opacity-50">
              <span className="border-b border-slate pb-[2px]">{t.conv.drawCard}</span>
            </button>
          </div>
        </footer>
      )}

      <PlansSheet locale={locale} open={plans} onClose={() => setPlans(false)} />

      <Sheet open={wall} onClose={() => {}} dismissible={false}>
        <SignupForm locale={locale} onDone={onSignedUp} />
      </Sheet>

      <Sheet open={keep} onClose={() => setKeep(false)}>
        {/* Monté seulement à l'ouverture : un seul formulaire d'inscription dans la page. */}
        {keep && <SignupForm locale={locale} onDone={onSignedUp} title={t.wall.keepTitle} body={t.wall.keepBody} />}
      </Sheet>

      <Sheet open={offer !== null} onClose={closeOffer}>
        <div className="pb-4 text-center">
          <p className="display text-[30px]">{offer === "early" ? t.wall.earlyTitle : t.wall.offerTitle}</p>
          <p className="mt-3 text-[15px] text-ink-2">{offer === "early" ? t.wall.earlyBody : t.wall.offerBody}</p>
          <button onClick={closeOffer} className="btn-primary mt-8 w-full">
            {t.wall.offerCta}
          </button>
        </div>
      </Sheet>

      {zoom && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas/95 p-8" onClick={() => setZoom(null)}>
          <div className="tarot aspect-[2/3] w-full max-w-[340px]">
            <img src={`${zoom.card.image_path}.webp`} alt={name(zoom)?.name} className="h-full w-full object-cover" />
          </div>
          <p className="arcana mt-6 text-[20px]">{name(zoom)?.name}</p>
          <p className="meta mt-2">{meta(zoom, myDeck ? t.conv.myDeck : t.conv.deckLine(zoom.card.decks.name))}</p>
        </div>
      )}
    </div>
  );
}
