import { requireAccount } from "@/lib/session";
import { arcanaName, cardImage, listArcana, listDecks } from "@/lib/decks";
import { drawsWithMyDeck, getMyDeck } from "@/lib/mydeck";
import { createServiceClient } from "@/lib/supabase/admin";
import { effectivePlan } from "@/lib/plans";
import { AppShell } from "@/components/AppShell";
import { MyDeckView, type Version } from "./MyDeckView";

/** My Deck : 22 emplacements, une version de chaque arcane piochée dans tous les decks. */
export default async function MyDeck() {
  const { profile } = await requireAccount();
  const locale = profile.locale;
  const [mine, arcana, decks, active] = await Promise.all([getMyDeck(profile.id), listArcana(), listDecks(), drawsWithMyDeck(profile)]);
  const { data: cards } = await createServiceClient()
    .from("cards")
    .select("id, arcana, image_path, deck_id")
    .in("deck_id", decks.map((d) => d.id));

  const names = new Map(decks.map((d) => [d.id, d]));
  const versions: Version[] = (cards ?? [])
    .map((c) => ({ id: c.id, arcana: c.arcana, image: cardImage(c.image_path, true), deck: names.get(c.deck_id)!.name, sort: names.get(c.deck_id)!.sort }))
    .sort((a, b) => a.sort - b.sort);

  return (
    <AppShell locale={locale} firstName={profile.first_name}>
      <MyDeckView
        locale={locale}
        arcana={arcana.map((a) => ({ number: a.number, numeral: a.numeral, name: arcanaName(a, locale) }))}
        versions={versions}
        initial={Object.fromEntries(mine.map((c) => [c.arcana, c.card_id]))}
        active={active}
        canDraw={effectivePlan(profile).customDeck}
      />
    </AppShell>
  );
}
