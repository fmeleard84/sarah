import { getLocale, getSession } from "@/lib/session";
import { cardImage, deckCards, deckDescription, listDecks } from "@/lib/decks";
import { DeckPicker } from "./DeckPicker";

/**
 * Onboarding, étape 1 : bienvenue et choix du deck, sans compte.
 * La personnalisation d'abord. Le compte vient après la première conversation.
 */
export default async function Welcome() {
  const [locale, decks, { profile }] = await Promise.all([getLocale(), listDecks(), getSession()]);
  const open = decks.filter((d) => d.is_open);

  const items = await Promise.all(
    open.map(async (d) => {
      const cards = await deckCards(d.id);
      const cover = cards.find((c) => c.arcana === d.cover_arcana) ?? cards[0];
      return {
        slug: d.slug,
        name: d.name,
        artist: d.artist,
        description: deckDescription(d, locale),
        cover: cardImage(cover.image_path, true),
        samples: [1, 6, 17].map((n) => cardImage(cards[n].image_path, true)),
      };
    }),
  );

  return <DeckPicker locale={locale} decks={items} hasSession={Boolean(profile)} />;
}
