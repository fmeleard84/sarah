"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Locale } from "@/lib/i18n";
import { useDict } from "@/components/I18nProvider";
import { Picto } from "@/components/Picto";
import { PlansSheet } from "@/components/PlansSheet";
import { Sheet } from "@/components/Sheet";
import { SignupForm } from "@/components/SignupForm";

const DRAW_TOKEN = "[[DRAW_CARD]]";
const ANON_MESSAGES = 2;

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
  const [anon, setAnon] = useState(isAnonymous);
  const [zoom, setZoom] = useState<Card | null>(null);
  const [offer, setOffer] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const userCount = messages.filter((m) => m.role === "user").length;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const suggestsCard = !streaming && lastAssistant?.content.includes(DRAW_TOKEN);

  // Accolades obligatoires : sur les Chrome récents, scrollIntoView renvoie une Promise,
  // que React prendrait pour une fonction de nettoyage (« i is not a function »).
  const scrollDown = useCallback(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);
  useEffect(() => {
    scrollDown();
  }, [messages.length, scrollDown]);

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
    if (next) run({ reveal: next.position }, "reveal", next.position);
  }, [cards, messages, streaming, error, run]);

  // Onboarding : après la 2e réponse, le mur d'inscription.
  useEffect(() => {
    if (anon && !streaming && userCount >= ANON_MESSAGES && lastAssistant?.kind === "text") setWall(true);
  }, [anon, streaming, userCount, lastAssistant]);

  async function send() {
    const text = input.trim();
    if (!text || busy.current) return;
    setInput("");
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: "user", kind: "text", card_position: null, content: text }]);
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
    setOffer(true);
  }

  // Le rafraîchissement (session devenue un compte) attend la fermeture de
  // l'offre : lancé plus tôt, il remontait l'écran sous le bouton.
  function closeOffer() {
    setOffer(false);
    router.refresh();
  }

  const name = (c: Card) => names[c.card.arcana];
  const blurLast = anon && userCount >= ANON_MESSAGES;

  return (
    <div className="flex h-dvh flex-col">
      {/* En-tête : retour, cartes du tirage en miniature, centrées, même hauteur. */}
      <header className="relative flex items-center justify-center border-b border-rule/60 px-[10%] pb-3 pt-[max(env(safe-area-inset-top),14px)]">
        {!anon && (
          <Link href="/journal" aria-label={t.conv.back} className="absolute left-4 top-[max(env(safe-area-inset-top),14px)] flex h-12 w-10 items-center text-[26px] text-ink/70">
            ‹
          </Link>
        )}
        <div className="flex flex-col items-center">
          <div className="flex gap-2">
            {cards.map((c) => (
              <button key={c.position} onClick={() => setZoom(c)} className="tarot h-12 w-8 shrink-0">
                <img src={`${c.card.image_path}-sm.webp`} alt={name(c)?.name} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          {cards.length === 1 && <p className="title mt-1.5 text-[14px]">{name(cards[0])?.name}</p>}
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-[10%] pb-6 pt-6">
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          if (m.kind === "reveal") {
            const c = cards.find((k) => k.position === m.card_position);
            return (
              <div key={m.id} className="fade-up mb-8">
                {c && cards.length > 1 && <p className="label mb-3 text-center text-ink-3">{`${name(c)?.numeral} · ${name(c)?.name}`}</p>}
                <p className="display whitespace-pre-line text-center text-[20px] leading-relaxed" style={{ lineHeight: 1.45 }}>
                  {display(m.content)}
                </p>
              </div>
            );
          }
          if (m.role === "user") {
            return (
              <div key={m.id} className="mb-6 flex justify-end">
                <p className="max-w-[min(85%,680px)] whitespace-pre-line bg-surface px-4 py-3 text-[16px] leading-relaxed" style={{ borderRadius: 4 }}>
                  {m.content}
                </p>
              </div>
            );
          }
          return (
            <p
              key={m.id}
              className={`mb-6 whitespace-pre-line text-[16px] leading-relaxed transition-[filter] ${isLast && blurLast ? "select-none blur-[5px]" : ""}`}
            >
              {display(m.content)}
            </p>
          );
        })}

        {streaming && (
          <div className="mb-6">
            {streaming.text === "" ? (
              <div className="flex justify-center py-4">
                <Picto size={40} animated />
              </div>
            ) : streaming.kind === "reveal" ? (
              <p className="display whitespace-pre-line text-center text-[20px]" style={{ lineHeight: 1.45 }}>
                {display(streaming.text)}
              </p>
            ) : (
              <p className={`whitespace-pre-line text-[16px] leading-relaxed ${anon && userCount >= ANON_MESSAGES ? "select-none blur-[5px]" : ""}`}>
                {display(streaming.text)}
              </p>
            )}
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
        <div ref={bottom} />
      </main>

      {/* Zone de saisie : sous une ligne, sans boîte ; flèche visible au premier caractère. */}
      {!blurLast && (
        <footer className="border-t border-rule/60 bg-canvas px-[10%] pb-[max(env(safe-area-inset-bottom),14px)] pt-2">
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
          {!anon && !suggestsCard && userCount >= 2 && !streaming && (
            <button onClick={() => setPicker(true)} className="label pb-1 pt-1 text-ink/40">
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
          <p className="title mt-6 text-[22px]">{`${name(zoom)?.numeral} · ${name(zoom)?.name}`}</p>
          <p className="mt-1 text-[13px] text-ink-3">{zoom.card.decks.name}</p>
        </div>
      )}
    </div>
  );
}
