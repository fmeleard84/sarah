import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";
import { MY_DECK_SIZE, effectivePlan } from "@/lib/plans";
import type { Profile } from "@/lib/session";

export interface MyDeckCard {
  arcana: number;
  card_id: string;
  card: { image_path: string; decks: { slug: string; name: string } };
}

/** Les cartes choisies, une par arcane, dans l'ordre des arcanes. */
export async function getMyDeck(userId: string): Promise<MyDeckCard[]> {
  const { data } = await createServiceClient()
    .from("my_deck_cards")
    .select("arcana, card_id, card:cards(image_path, decks(slug, name))")
    .eq("user_id", userId)
    .order("arcana");
  return (data ?? []) as unknown as MyDeckCard[];
}

/** Pourquoi ce profil ne peut pas tirer avec son deck, ou null s'il le peut. */
export async function myDeckBlock(profile: Profile) {
  if (!effectivePlan(profile).customDeck) return "plan" as const;
  const { count } = await createServiceClient().from("my_deck_cards").select("arcana", { count: "exact", head: true }).eq("user_id", profile.id);
  return (count ?? 0) < MY_DECK_SIZE ? ("incomplete" as const) : null;
}

/** Tire-t-on vraiment avec My Deck ? Une offre perdue ramène au deck principal. */
export async function drawsWithMyDeck(profile: Profile) {
  return profile.use_my_deck && (await myDeckBlock(profile)) === null;
}
