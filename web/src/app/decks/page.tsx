import Link from "next/link";
import { requireAccount } from "@/lib/session";
import { cardImage, deckCards, listDecks } from "@/lib/decks";
import { getMyDeck } from "@/lib/mydeck";
import { MY_DECK_SIZE } from "@/lib/plans";
import { getDict } from "@/lib/texts";
import { AppShell } from "@/components/AppShell";
import { Tick } from "@/components/Tick";

/**
 * Bibliothèque : une galerie, façon fil Instagram (retour de Sarah du 5 novembre).
 * Sur mobile, la grille déborde des marges de 10 % pour agrandir les visuels ; le
 * nom reste discret. Le deck actif porte une coche ; les nouveaux decks, « NEW ».
 */
export default async function Library() {
  const { profile } = await requireAccount();
  const t = (await getDict(profile.locale));
  const decks = await listDecks();
  const mine = await getMyDeck(profile.id);

  const items = await Promise.all(
    decks.map(async (d) => {
      const cards = await deckCards(d.id);
      const cover = cards.find((c) => c.arcana === d.cover_arcana) ?? cards[0];
      const isNew = Date.now() - new Date(d.created_at).getTime() < 21 * 86400_000;
      return { ...d, cover: cardImage(cover.image_path), isNew };
    }),
  );

  return (
    <AppShell locale={profile.locale} firstName={profile.first_name}>
      <header className="pt-5">
        <h1 className="page-title">{t.decks.title}</h1>
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <p className="text-[13px] text-ink-3">{t.decks.cards(decks.length * 22)}</p>
          <Link href="/decks/mon-deck" className="btn-link text-slate" style={{ fontSize: 14 }}>
            {t.decks.myDeckLink(mine.length, MY_DECK_SIZE)}
          </Link>
        </div>
      </header>

      <div className="-mx-[6vw] mt-6 grid grid-cols-2 items-start gap-x-2 gap-y-4 md:mx-0 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4">
            {items.map((d) => {
              const active = !profile.use_my_deck && d.id === profile.main_deck_id;
              return (
                <Link key={d.id} href={`/decks/${d.slug}`} className="group relative block">
                  <div className="tarot aspect-[2/3] transition-transform duration-300 group-hover:-translate-y-0.5 group-active:scale-[0.98]">
                    <img src={d.cover} alt={d.name} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  {active ? (
                    <span className="absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center bg-canvas text-ink" aria-label={t.decks.active}>
                      <Tick />
                    </span>
                  ) : (
                    d.isNew && <span className="label absolute left-2.5 top-2.5 bg-canvas px-1.5 py-0.5 text-[10px] text-ink">new</span>
                  )}
                  <p className="mt-1.5 px-0.5 text-[12px] text-ink-3">{d.name}</p>
                </Link>
              );
            })}
      </div>
    </AppShell>
  );
}
