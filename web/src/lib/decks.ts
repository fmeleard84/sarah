import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";
import type { Locale } from "@/lib/i18n";

export interface Deck {
  id: string;
  slug: string;
  number: number;
  name: string;
  description_fr: string;
  description_en: string;
  styles: string[];
  moods: string[];
  artist: string | null;
  cover_arcana: number;
  is_open: boolean;
  sort: number;
  created_at: string;
}

export interface Arcana {
  number: number;
  numeral: string;
  name_fr: string;
  name_en: string;
}

export interface Card {
  id: string;
  deck_id: string;
  arcana: number;
  image_path: string;
}

export const cardImage = (path: string, small = false) => `${path}${small ? "-sm" : ""}.webp`;
export const deckDescription = (d: Deck, l: Locale) => (l === "en" ? d.description_en : d.description_fr);
export const arcanaName = (a: Arcana, l: Locale) => (l === "en" ? a.name_en : a.name_fr);

export async function listDecks(): Promise<Deck[]> {
  const { data } = await createServiceClient().from("decks").select("*").eq("is_published", true).order("sort");
  return (data ?? []) as Deck[];
}

export async function getDeck(slug: string): Promise<Deck | null> {
  const { data } = await createServiceClient().from("decks").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
  return data as Deck | null;
}

export async function listArcana(): Promise<Arcana[]> {
  const { data } = await createServiceClient().from("arcana").select("*").order("number");
  return (data ?? []) as Arcana[];
}

export async function deckCards(deckId: string): Promise<Card[]> {
  const { data } = await createServiceClient().from("cards").select("*").eq("deck_id", deckId).order("arcana");
  return (data ?? []) as Card[];
}

/** Même arcane dans les autres decks publiés. */
export async function arcanaAcrossDecks(arcana: number) {
  const { data } = await createServiceClient()
    .from("cards")
    .select("id, arcana, image_path, decks!inner(slug, name, sort, is_published)")
    .eq("arcana", arcana)
    .eq("decks.is_published", true);
  return ((data ?? []) as unknown as { id: string; arcana: number; image_path: string; decks: { slug: string; name: string; sort: number } }[]).sort(
    (a, b) => a.decks.sort - b.decks.sort,
  );
}
