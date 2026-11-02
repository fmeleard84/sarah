"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DICTS, type Locale } from "@/lib/i18n";
import { Sheet } from "@/components/Sheet";

interface Item {
  slug: string;
  name: string;
  artist: string | null;
  description: string;
  cover: string;
  samples: string[];
}

export function DeckPicker({ locale, decks, hasSession }: { locale: Locale; decks: Item[]; hasSession: boolean }) {
  const t = DICTS[locale];
  const router = useRouter();
  const [selected, setSelected] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(slug: string) {
    setBusy(true);
    setError(null);
    try {
      // Première visite : une session anonyme porte le deck et la conversation
      // jusqu'à la création du compte.
      if (!hasSession) {
        const { error } = await createClient().auth.signInAnonymously();
        if (error) throw error;
      }
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mainDeck: slug, locale }),
      });
      if (!res.ok) throw new Error(String(res.status));
      router.push("/tirage");
      router.refresh();
    } catch {
      setError(t.auth.generic);
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh px-[10%] pb-16 pt-[max(env(safe-area-inset-top),28px)]">
      <header className="fade-up flex flex-col items-center pt-6 text-center">
        <img src="/brand/picto.svg" alt="" className="h-10 w-auto" />
        <img src="/brand/wordmark.svg" alt="Morning Cards" className="mt-4 h-[11px] w-auto" />
        <h1 className="display mt-14 text-[40px]">{t.welcome.title}</h1>
        <p className="mt-5 text-[15px] text-ink-2">{t.welcome.body}</p>
      </header>

      <section className="mt-16">
        <h2 className="title text-[26px]">{t.welcome.pick}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{t.welcome.pickHelp}</p>

        <ul className="mt-8 grid grid-cols-2 gap-x-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-8">
          {decks.map((d, i) => (
            <li key={d.slug} className="fade-up" style={{ animationDelay: `${120 + i * 60}ms` }}>
              <button onClick={() => setSelected(d)} className="group block w-full text-left">
                <div className="tarot aspect-[2/3] transition-transform duration-300 group-hover:-translate-y-0.5 group-active:scale-[0.98]">
                  <img src={d.cover} alt="" className="h-full w-full object-cover" loading={i < 4 ? "eager" : "lazy"} />
                </div>
                <p className="title mt-3 text-[18px]">{d.name}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-14 text-center text-[13px]">
        <Link href="/connexion" className="btn-link text-ink-2">
          {t.welcome.login}
        </Link>
      </p>

      <Sheet open={Boolean(selected)} onClose={() => !busy && setSelected(null)}>
        {selected && (
          <div className="pb-2">
            <h3 className="title text-[28px]">{selected.name}.</h3>
            {selected.artist && <p className="mt-1 text-[13px] italic text-ink-3">{t.decks.inspired(selected.artist)}</p>}
            <p className="display mt-4 text-[17px] leading-snug text-ink/80" style={{ lineHeight: 1.45 }}>
              {selected.description}
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {selected.samples.map((s) => (
                <div key={s} className="tarot aspect-[2/3]">
                  <img src={s} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            {error && <p className="mt-4 text-[13px] text-rose">{error}</p>}
            <button onClick={() => choose(selected.slug)} disabled={busy} className="btn-primary label mt-8 w-full">
              {t.welcome.cta}
            </button>
          </div>
        )}
      </Sheet>
    </main>
  );
}
