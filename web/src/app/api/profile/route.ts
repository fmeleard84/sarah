import { NextResponse } from "next/server";
import { LOCALE_COOKIE, getSession } from "@/lib/session";
import { effectivePlan } from "@/lib/plans";
import { isLocale } from "@/lib/i18n";
import { THEME_COOKIE, isTheme } from "@/lib/theme";
import { myDeckBlock } from "@/lib/mydeck";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Mise à jour du profil. Le plan et les crédits n'y figurent pas : ils ne
 * changent qu'au paiement.
 */
const WORLD_KEYS = ["love", "work", "family", "health", "money", "growth"];

export async function PATCH(req: Request) {
  const { user, profile } = await getSession();
  if (!user || !profile) return NextResponse.json({ error: "no_session" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const db = createServiceClient();
  const patch: Record<string, unknown> = {};

  if (typeof body.mainDeck === "string") {
    const { data: deck } = await db.from("decks").select("id, is_open, name").eq("slug", body.mainDeck).eq("is_published", true).maybeSingle();
    if (!deck) return NextResponse.json({ error: "deck_not_found" }, { status: 404 });
    if (!deck.is_open && !effectivePlan(profile).allDecks) return NextResponse.json({ reason: "deck_locked" }, { status: 402 });
    patch.main_deck_id = deck.id;
    patch.use_my_deck = false;
  }
  if (body.useMyDeck === true) {
    const block = await myDeckBlock(profile);
    if (block) return NextResponse.json({ reason: block }, { status: block === "plan" ? 402 : 409 });
    patch.use_my_deck = true;
  }
  if (body.world && typeof body.world === "object") {
    const world: Record<string, string> = {};
    for (const key of WORLD_KEYS) if (typeof body.world[key] === "string") world[key] = body.world[key].trim().slice(0, 500);
    patch.world = world;
  }
  if (typeof body.firstName === "string") patch.first_name = body.firstName.trim().slice(0, 60) || null;
  if (typeof body.birthdate === "string") patch.birthdate = /^\d{4}-\d{2}-\d{2}$/.test(body.birthdate) ? body.birthdate : null;
  if (isLocale(body.locale)) patch.locale = body.locale;
  if (typeof body.notifyEmail === "boolean") patch.notify_email = body.notifyEmail;

  if (Object.keys(patch).length) await db.from("profiles").update(patch).eq("id", user.id);

  const res = NextResponse.json({ ok: true });
  if (isLocale(body.locale)) res.cookies.set(LOCALE_COOKIE, body.locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
  if (isTheme(body.theme)) res.cookies.set(THEME_COOKIE, body.theme, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return res;
}
