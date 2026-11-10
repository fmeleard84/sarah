import { requireAccount } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { listArcana } from "@/lib/decks";
import { AppShell } from "@/components/AppShell";
import { JournalList, type Entry } from "./JournalList";

/** Journal : conversations en ordre antichronologique, on peut les reprendre. */
export default async function Journal() {
  const { user, profile } = await requireAccount();
  const [{ data }, arcana] = await Promise.all([
    createServiceClient()
      .from("conversations")
      .select("id, title, favorite, created_at, conversation_cards(position, card:cards(arcana, image_path))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
    listArcana(),
  ]);
  const locale = profile.locale;

  const entries: Entry[] = ((data ?? []) as unknown as {
    id: string;
    title: string | null;
    favorite: boolean;
    created_at: string;
    conversation_cards: { position: number; card: { arcana: number; image_path: string } }[];
  }[]).map((c) => {
    const cards = [...c.conversation_cards].sort((a, b) => a.position - b.position);
    return {
      id: c.id,
      title: c.title,
      favorite: c.favorite,
      createdAt: c.created_at,
      images: cards.map((k) => `${k.card.image_path}-sm.webp`),
      numbers: cards.map((k) => k.card.arcana),
      names: cards.map((k) => (locale === "en" ? arcana[k.card.arcana].name_en : arcana[k.card.arcana].name_fr)),
    };
  });

  return (
    <AppShell locale={locale} firstName={profile.first_name}>
      <JournalList locale={locale} entries={entries} />
    </AppShell>
  );
}
