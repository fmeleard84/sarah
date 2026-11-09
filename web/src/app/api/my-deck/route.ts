import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { drawsWithMyDeck } from "@/lib/mydeck";

/** Compose son deck : toutes les offres peuvent le faire, le tirage est réservé. */
async function account() {
  const { user, profile, isAnonymous } = await getSession();
  return user && profile && !isAnonymous ? { user, profile } : null;
}

/** Ajoute une carte, ou remplace la version déjà choisie pour cet arcane. */
export async function POST(req: Request) {
  const me = await account();
  if (!me) return NextResponse.json({ error: "account_required" }, { status: 401 });
  const { cardId } = await req.json().catch(() => ({ cardId: null }));
  if (typeof cardId !== "string") return NextResponse.json({ error: "bad_card" }, { status: 400 });

  const db = createServiceClient();
  const { data: card } = await db.from("cards").select("id, arcana, decks!inner(is_published)").eq("id", cardId).eq("decks.is_published", true).maybeSingle();
  if (!card) return NextResponse.json({ error: "card_not_found" }, { status: 404 });

  const { error } = await db.from("my_deck_cards").upsert({ user_id: me.user.id, arcana: card.arcana, card_id: card.id }, { onConflict: "user_id,arcana" });
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Retire un arcane. Un deck incomplet ne peut plus servir au tirage. */
export async function DELETE(req: Request) {
  const me = await account();
  if (!me) return NextResponse.json({ error: "account_required" }, { status: 401 });
  const { arcana } = await req.json().catch(() => ({ arcana: null }));
  if (!Number.isInteger(arcana)) return NextResponse.json({ error: "bad_arcana" }, { status: 400 });

  const db = createServiceClient();
  await db.from("my_deck_cards").delete().eq("user_id", me.user.id).eq("arcana", arcana);
  if (me.profile.use_my_deck && !(await drawsWithMyDeck(me.profile))) {
    await db.from("profiles").update({ use_my_deck: false }).eq("id", me.user.id);
  }
  return NextResponse.json({ ok: true });
}
