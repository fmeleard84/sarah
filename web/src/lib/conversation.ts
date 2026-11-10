import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/session";
import { effectivePlan, periodStart, type Plan } from "@/lib/plans";
import { drawsWithMyDeck, getMyDeck } from "@/lib/mydeck";
import { buildSystemPrompt, type PromptCard, type Summary } from "@/lib/prompt";
import type { ChatMessage } from "@/lib/llm";

export type Refusal =
  | { reason: "quota"; period: "day" | "week" }
  | { reason: "spread" }
  | { reason: "card_limit" }
  | { reason: "deck_locked" }
  | { reason: "signup_required" };

export interface ConvCard {
  position: number;
  is_extra: boolean;
  card: {
    id: string;
    arcana: number;
    image_path: string;
    arch_color: string | null;
    arch_intensity: number;
    decks: { slug: string; name: string; description_fr: string; description_en: string };
  };
}

const db = () => createServiceClient();

/** Tire `count` arcanes distincts, hors ceux déjà présents. */
function pickArcana(count: number, exclude: number[]) {
  const pool = Array.from({ length: 22 }, (_, i) => i).filter((n) => !exclude.includes(n));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

async function conversationsInPeriod(userId: string, plan: Plan) {
  const { count } = await db()
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", periodStart(plan.period).toISOString());
  return count ?? 0;
}

/** Le quota de conversations de la période est-il atteint ? */
export async function quotaReached(profile: Profile, isAnonymous: boolean) {
  const plan = effectivePlan(profile);
  if (plan.conversations === null) return null;
  const used = await conversationsInPeriod(profile.id, plan);
  return used >= (isAnonymous ? 1 : plan.conversations) ? plan.period : null;
}

/** Ouvre une conversation avec un tirage initial. */
export async function startConversation(profile: Profile, spreadSize: 1 | 3 | 5, isAnonymous: boolean) {
  const plan = effectivePlan(profile);
  if (!plan.spreads.includes(spreadSize)) return { refused: { reason: "spread" } as Refusal };

  // Une session anonyme n'a droit qu'au tirage de l'onboarding.
  if (plan.conversations !== null) {
    const used = await conversationsInPeriod(profile.id, plan);
    if (used >= (isAnonymous ? 1 : plan.conversations)) return { refused: { reason: "quota", period: plan.period } as Refusal };
  }

  const arcana = pickArcana(spreadSize, []);
  const fromMyDeck = await drawsWithMyDeck(profile);
  let deckId: string | null = null;
  let byArcana: Map<number, string>;

  if (fromMyDeck) {
    byArcana = new Map((await getMyDeck(profile.id)).map((c) => [c.arcana, c.card_id]));
  } else {
    const { data: deck } = await db().from("decks").select("id, is_open").eq("id", profile.main_deck_id!).single();
    if (!deck) throw new Error("deck introuvable");
    if (!deck.is_open && !plan.allDecks) return { refused: { reason: "deck_locked" } as Refusal };
    deckId = deck.id;
    const { data: cards } = await db().from("cards").select("id, arcana").eq("deck_id", deck.id).in("arcana", arcana);
    byArcana = new Map((cards ?? []).map((c) => [c.arcana, c.id]));
  }

  // deck_id vide : tirage avec My Deck, chaque carte porte son propre deck.
  const { data: conv, error } = await db()
    .from("conversations")
    .insert({ user_id: profile.id, deck_id: deckId, spread_size: spreadSize })
    .select("id")
    .single();
  if (error) throw error;

  await db()
    .from("conversation_cards")
    .insert(arcana.map((a, i) => ({ conversation_id: conv.id, position: i, card_id: byArcana.get(a)! })));

  return { id: conv.id as string };
}

/** Ajoute une carte en cours de conversation, si l'offre ou les crédits le permettent. */
export async function drawExtraCard(profile: Profile, conversationId: string, isAnonymous: boolean) {
  if (isAnonymous) return { refused: { reason: "signup_required" } as Refusal };
  const plan = effectivePlan(profile);
  const cards = await getConversationCards(conversationId);

  const withinPlan = cards.length < plan.cardsPerConversation;
  if (!withinPlan && profile.extra_cards <= 0) return { refused: { reason: "card_limit" } as Refusal };
  if (cards.length >= 22) return { refused: { reason: "card_limit" } as Refusal };

  const { data: conv } = await db().from("conversations").select("deck_id").eq("id", conversationId).single();
  const [arcana] = pickArcana(1, cards.map((c) => c.card.arcana));
  let cardId: string;
  if (conv!.deck_id) {
    const { data: card } = await db().from("cards").select("id").eq("deck_id", conv!.deck_id).eq("arcana", arcana).single();
    cardId = card!.id;
  } else {
    const mine = (await getMyDeck(profile.id)).find((c) => c.arcana === arcana);
    if (!mine) return { refused: { reason: "card_limit" } as Refusal };
    cardId = mine.card_id;
  }

  await db()
    .from("conversation_cards")
    .insert({ conversation_id: conversationId, position: cards.length, card_id: cardId, is_extra: true });

  if (!withinPlan) {
    await db().from("profiles").update({ extra_cards: profile.extra_cards - 1 }).eq("id", profile.id);
  }
  return { position: cards.length };
}

export async function getConversation(id: string, userId: string) {
  const { data } = await db().from("conversations").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  return data as { id: string; user_id: string; deck_id: string; spread_size: number; title: string | null; favorite: boolean; created_at: string } | null;
}

export async function getConversationCards(id: string): Promise<ConvCard[]> {
  const { data } = await db()
    .from("conversation_cards")
    .select("position, is_extra, card:cards(id, arcana, image_path, arch_color, arch_intensity, decks(slug, name, description_fr, description_en))")
    .eq("conversation_id", id)
    .order("position");
  return (data ?? []) as unknown as ConvCard[];
}

export async function getMessages(id: string) {
  const { data } = await db()
    .from("messages")
    .select("id, role, kind, card_position, content, created_at")
    .eq("conversation_id", id)
    .order("created_at");
  return (data ?? []) as { id: string; role: "user" | "assistant"; kind: "text" | "reveal"; card_position: number | null; content: string; created_at: string }[];
}

/** Contexte complet pour le modèle : prompt système + historique. */
export async function buildContext(profile: Profile, conversationId: string, plan: Plan, locale: "fr" | "en") {
  const [cards, messages, arcana, previous] = await Promise.all([
    getConversationCards(conversationId),
    getMessages(conversationId),
    db().from("arcana").select("*").order("number"),
    db()
      .from("conversations")
      .select("created_at, summary, conversation_cards(position, card:cards(arcana))")
      .eq("user_id", profile.id)
      .neq("id", conversationId)
      .not("summary", "is", null)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const names = new Map((arcana.data ?? []).map((a) => [a.number, a]));

  const promptCards: PromptCard[] = cards.map((c) => {
    const a = names.get(c.card.arcana)!;
    return {
      position: c.position,
      arcanaNumber: c.card.arcana,
      numeral: a.numeral,
      name: locale === "en" ? a.name_en : a.name_fr,
      deckName: c.card.decks.name,
      deckDescription: locale === "en" ? c.card.decks.description_en : c.card.decks.description_fr,
      isExtra: c.is_extra,
    };
  });

  const summaries = ((previous.data ?? []) as unknown as { created_at: string; summary: Summary; conversation_cards: { card: { arcana: number } }[] }[]).map((p) => ({
    date: new Date(p.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }),
    cards: p.conversation_cards.map((cc) => names.get(cc.card.arcana)?.name_fr).filter(Boolean).join(", "),
    summary: p.summary,
  }));

  const system = buildSystemPrompt({
    firstName: profile.first_name,
    world: profile.world,
    locale,
    now: new Date(),
    spreadSize: cards.filter((c) => !c.is_extra).length,
    cards: promptCards,
    memory: { summaries },
    canSuggestCard: cards.length < 22,
  });

  const history: ChatMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));
  return { system, history, cards, promptCards, messages };
}
