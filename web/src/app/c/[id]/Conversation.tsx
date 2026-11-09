"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { type Locale } from "@/lib/i18n";
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
  card: { id: string; arcana: number; image_path: string; decks: { name: string } };
}
interface Message {
  id: string;
  role: "user" | "assistant";
  kind: "text" | "reveal";
  card_position: number | null;
  content: string;
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
}: {
  id: string;
  locale: Locale;
  isAnonymous: boolean;
  initialCards: Card[];
  initialMessages: Message[];
  names: Record<number, { numeral: string; name: string }>;
}) {
  const t = useDict(locale);
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [messages, setMessages] = useState(initialMessages);
  const [streaming, setStreaming] = useState<null | { kind: "text" | "reveal"; position: number | null; text: string }>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [picker, setPicker] = useState(false);
  const [plans, setPlans] = useState(false);
  const [wall, setWall] = useState(false);
  /** Inscription proposée sans bloquer, avant le mur du 3e message. */
  const [keep, setKeep] = useState(false);
  const [anon, setAnon] = useState(isAnonymous);
  const [zoom, setZoom] = useState<Card | null>(null);
  const [offer, setOffer] = useState(false);
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
    setPicker(false);
    const res = await fetch(`/api/conversations/${id}/cards`, { method: "POST" });
    if (res.status === 402) {
      const r = await res.json();
      if (r.reason === "signup_required") setWall(true);
      else setPlans(true);
      return;
    }
    if (!res.ok) return setError(true);
    const state = await fetch(`/api/conversations/${id}`).then((r) => r.json());
    setCards(state.cards);
  }

  function onSignedUp() {
    setAnon(false);
    setWall(false);
    setKeep(false);
    setOffer(true);
  }

  // Le rafraîchissement (session devenue un compte) attend la fermeture de
  // l'offre : lancé plus tôt, il remontait l'écran sous le bouton.
  function closeOffer() {
    setOffer(false);
    router.refresh();
    const text = pending.current;
    pending.current = null;
    if (text) run({ message: text }, "text", null);
  }

  const name = (c: Card) => names[c.card.arcana];
  const lastUserId = [...messages].reverse().find((m) => m.role === "user")?.id;
  const anchorOnReveal = streaming?.kind === "reveal" && streaming.position !== null && cards[streaming.position]?.is_extra;

  return (
    <div className="flex h-dvh flex-col">
      {/* En-tête : retour, cartes du tirage en miniature, centrées, même hauteur. */}
      <header className="hair-b relative flex items-center gap-3 px-[10%] pb-3 pt-[max(env(safe-area-inset-top),14px)]">
        {!anon && (
          <Link href="/journal" aria-label={t.conv.back} className="absolute left-4 top-[max(env(safe-area-inset-top),14px)] flex h-12 w-10 items-center text-[26px] text-ink/70">
            ‹
          </Link>
        )}
        <div className="flex gap-2">
          {cards.map((c) => (
            <button key={c.position} onClick={() => setZoom(c)} className="tarot h-12 w-8 shrink-0">
              <img src={`${c.card.image_path}-sm.webp`} alt={name(c)?.name} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        {cards.length === 1 && (
          <div className="min-w-0">
            <p className="title truncate text-[20px]">{`${name(cards[0])?.numeral} · ${name(cards[0])?.name}`}</p>
            <p className="label mt-0.5 truncate text-ink-3">{cards[0].card.decks.name}</p>
          </div>
        )}
      </header>

      <main ref={scroller} className="no-scrollbar flex-1 overflow-y-auto px-[10%] pb-6 pt-6">
        {messages.map((m) => {
          if (m.kind === "reveal") {
            const c = cards.find((k) => k.position === m.card_position);
            return (
              <div key={m.id} className="fade-up mb-8">
                {c && cards.length > 1 && <p className="label mb-3 text-ink-3">{`${name(c)?.numeral} · ${name(c)?.name}`}</p>}
                <p className="display whitespace-pre-line text-[23px]" style={{ lineHeight: 1.25 }}>
                  {display(m.content)}
                </p>
              </div>
            );
          }
          if (m.role === "user") {
            return (
              <div key={m.id} data-role="user" ref={m.id === lastUserId && !anchorOnReveal ? anchor : undefined} className="mb-6 ml-7 max-w-[680px] scroll-mt-4 border-l-[0.5px] border-ink-3 pl-4">
                <p className="label mb-1 text-ink-3">{t.conv.youLabel}</p>
                <p className="whitespace-pre-line text-[16px] leading-relaxed">{m.content}</p>
              </div>
            );
          }
          return (
            <div key={m.id} data-role="assistant" className="mb-6 max-w-[680px]">
              <p className="label mb-1 text-ink-3">{t.conv.cardLabel}</p>
              <p className="whitespace-pre-line text-[16px] leading-relaxed">{display(m.content)}</p>
            </div>
          );
        })}

        {streaming && (
          <div ref={anchorOnReveal ? anchor : undefined} className="mb-6 scroll-mt-4">
            {streaming.text !== "" &&
              (streaming.kind === "reveal" ? (
                <p className="display whitespace-pre-line text-[23px]" style={{ lineHeight: 1.25 }}>
                  {display(streaming.text)}
                </p>
              ) : (
                <div className="max-w-[680px]">
                  <p className="label mb-1 text-ink-3">{t.conv.cardLabel}</p>
                  <p className="whitespace-pre-line text-[16px] leading-relaxed">{display(streaming.text)}</p>
                </div>
              ))}
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
            <button onClick={() => setError(false)} className="btn-primary label mt-6">
              {t.conv.retry}
            </button>
          </div>
        )}

        {suggestsCard && !anon && (
          <div className="fade-up my-6 flex justify-center">
            <button onClick={() => setPicker(true)} className="btn-primary label">
              {t.conv.drawCard}
            </button>
          </div>
        )}
        <div ref={spacer} aria-hidden="true" />
      </main>

      {/* Zone de saisie : sous une ligne, sans boîte ; flèche visible au premier caractère. */}
      {!wall && (
        <footer className="hair-t bg-canvas px-[10%] pb-[max(env(safe-area-inset-bottom),14px)] pt-2">
          <div className="flex items-end gap-3">
            <textarea
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
              className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-3 text-[16px] outline-none placeholder:text-ink/40"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            {input.trim() && (
              <button onClick={send} disabled={Boolean(streaming)} aria-label="Envoyer" className="h-11 px-1 text-[28px] leading-none text-slate disabled:opacity-40">
                ›
              </button>
            )}
          </div>
          {/* Sans compte : rappel discret que l'échange sera perdu, dès la première lecture. */}
          {anon && !streaming && messages.some((m) => m.role === "assistant") && (
            <p className="pb-1 pt-1 text-[13px] text-ink-3">
              {t.conv.notSaved}{" "}
              <button onClick={() => setKeep(true)} className="btn-link text-[13px] text-ink-2">
                {t.conv.keepIt}
              </button>
            </p>
          )}
          {!anon && !suggestsCard && userCount >= 2 && !streaming && (
            <button onClick={() => setPicker(true)} className="btn-link pb-1 pt-1 text-ink-3">
              {t.conv.drawCard}
            </button>
          )}
        </footer>
      )}

      {/* Choix d'une carte parmi cinq, face cachée. */}
      <Sheet open={picker} onClose={() => setPicker(false)}>
        <p className="display text-center text-[28px]">{t.conv.pickCard}</p>
        <p className="mt-1 text-center text-[13px] text-ink-3">{t.conv.pickHelp}</p>
        <div className="mt-8 flex justify-center gap-2 pb-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <button
              key={i}
              onClick={drawCard}
              className="tarot aspect-[2/3] w-[18%] transition-transform duration-300 hover:-translate-y-1 active:scale-95"
              style={{ transform: `rotate(${(i - 2) * 3}deg)` }}
            >
              <img src="/brand/card-back.webp" alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </Sheet>

      <PlansSheet locale={locale} open={plans} onClose={() => setPlans(false)} />

      <Sheet open={wall} onClose={() => {}} dismissible={false}>
        <SignupForm locale={locale} onDone={onSignedUp} />
      </Sheet>

      <Sheet open={keep} onClose={() => setKeep(false)}>
        {/* Monté seulement à l'ouverture : un seul formulaire d'inscription dans la page. */}
        {keep && <SignupForm locale={locale} onDone={onSignedUp} title={t.wall.keepTitle} body={t.wall.keepBody} />}
      </Sheet>

      <Sheet open={offer} onClose={closeOffer}>
        <div className="pb-4 text-center">
          <p className="display text-[30px]">{t.wall.offerTitle}</p>
          <p className="mt-3 text-[15px] text-ink-2">{t.wall.offerBody}</p>
          <button onClick={closeOffer} className="btn-primary label mt-8 w-full">
            {t.wall.offerCta}
          </button>
        </div>
      </Sheet>

      {zoom && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas/95 p-8" onClick={() => setZoom(null)}>
          <div className="tarot aspect-[2/3] w-full max-w-[340px]">
            <img src={`${zoom.card.image_path}.webp`} alt={name(zoom)?.name} className="h-full w-full object-cover" />
          </div>
          <p className="display mt-6 text-[28px]">{`${name(zoom)?.numeral} · ${name(zoom)?.name}`}</p>
          <p className="label mt-2 text-ink-3">{zoom.card.decks.name}</p>
        </div>
      )}
    </div>
  );
}
