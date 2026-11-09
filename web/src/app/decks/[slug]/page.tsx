import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/session";
import { cardImage, deckCards, deckDescription, getDeck, listArcana } from "@/lib/decks";
import { getDict } from "@/lib/texts";
import { effectivePlan } from "@/lib/plans";
import { AppShell } from "@/components/AppShell";
import { UseDeckButton } from "./UseDeckButton";

/** Fiche deck : description, toutes les cartes 2 par 2, « tirer avec ce deck ». */
export default async function DeckDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { profile } = await requireAccount();
  const deck = await getDeck(slug);
  if (!deck) notFound();
  const locale = profile.locale;
  const t = (await getDict(locale));
  const [cards, arcana] = await Promise.all([deckCards(deck.id), listArcana()]);
  const names = new Map(arcana.map((a) => [a.number, a]));
  const locked = !deck.is_open && !effectivePlan(profile).allDecks;

  return (
    <AppShell locale={locale} firstName={profile.first_name}>
      <Link href="/decks" className="-ml-1 inline-flex h-10 items-center text-[26px] text-ink/70" aria-label="Retour">
        ‹
      </Link>
      <header className="mt-2">
        <h1 className="display text-[44px]">{deck.name.toLowerCase()}</h1>
        {deck.artist && <p className="label mt-2 text-ink-3">{t.decks.inspired(deck.artist)}</p>}
        <p className="mt-5 text-[16px] text-ink-2" style={{ lineHeight: 1.55 }}>
          {deckDescription(deck, locale)}
        </p>
        <p className="mt-4 text-[12px] text-ink-3">{[...deck.styles, ...deck.moods].join(" · ")}</p>
      </header>

      <div className="mt-8">
        <UseDeckButton locale={locale} slug={deck.slug} name={deck.name} active={!profile.use_my_deck && deck.id === profile.main_deck_id} locked={locked} />
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-x-4 md:grid-cols-4 lg:grid-cols-6 gap-y-6">
        {cards.map((c) => {
          const a = names.get(c.arcana)!;
          return (
            <li key={c.id}>
              <Link href={`/decks/${deck.slug}/${c.arcana}`} className="group block">
                <div className="tarot aspect-[2/3] transition-transform duration-300 group-hover:-translate-y-0.5">
                  <img src={cardImage(c.image_path, true)} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <p className="title mt-2 text-[15px]">
                  <span className="text-ink-3">{a.numeral} · </span>
                  {locale === "en" ? a.name_en : a.name_fr}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
