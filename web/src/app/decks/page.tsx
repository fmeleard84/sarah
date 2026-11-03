import Link from "next/link";
import { requireAccount } from "@/lib/session";
import { cardImage, deckCards, listDecks } from "@/lib/decks";
import { getDict } from "@/lib/texts";
import { AppShell } from "@/components/AppShell";
import { Tick } from "@/components/Tick";

/**
 * Bibliothèque : grille masonry 2 colonnes, images sans texte ni icône.
 * Le deck actif porte une coche ; les nouveaux decks, « NEW ».
 */
export default async function Library() {
  const { profile } = await requireAccount();
  const t = (await getDict(profile.locale));
  const decks = await listDecks();

  const items = await Promise.all(
    decks.map(async (d) => {
      const cards = await deckCards(d.id);
      const cover = cards.find((c) => c.arcana === d.cover_arcana) ?? cards[0];
      const isNew = Date.now() - new Date(d.created_at).getTime() < 21 * 86400_000;
      return { ...d, cover: cardImage(cover.image_path, true), isNew };
    }),
  );

  return (
    <AppShell locale={profile.locale} firstName={profile.first_name}>
      <header className="pt-6">
        <h1 className="display text-[44px]">{t.decks.title}</h1>
        <p className="mt-1 text-[13px] text-ink-3">{t.decks.cards(decks.length * 22)}</p>
      </header>

      {/* Grille décalée : une tuile sur deux descend, quel que soit le nombre de colonnes. */}
      <div className="mt-8 grid grid-cols-2 items-start gap-4 md:grid-cols-3 lg:grid-cols-6 [&>*:nth-child(even)]:mt-10">
            {items.map((d) => {
              const active = d.id === profile.main_deck_id;
              return (
                <Link key={d.id} href={`/decks/${d.slug}`} className="group relative block">
                  <div className="tarot aspect-[2/3] transition-transform duration-300 group-hover:-translate-y-0.5 group-active:scale-[0.98]">
                    <img src={d.cover} alt={d.name} className="h-full w-full object-cover" />
                  </div>
                  {active ? (
                    <span className="absolute left-2.5 top-2.5 text-canvas drop-shadow" aria-label={t.decks.active}>
                      <Tick />
                    </span>
                  ) : (
                    d.isNew && <span className="label absolute left-2.5 top-2.5 bg-canvas px-1.5 py-0.5 text-[10px] text-ink">new</span>
                  )}
                  <p className="title mt-2 text-[17px]">{d.name}</p>
                </Link>
              );
            })}
      </div>
    </AppShell>
  );
}
