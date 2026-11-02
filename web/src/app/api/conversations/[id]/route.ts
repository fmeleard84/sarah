import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getConversation, getConversationCards, getMessages } from "@/lib/conversation";
import { createServiceClient } from "@/lib/supabase/admin";

/** État de la conversation (relu après un tirage ou une inscription). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "no_session" }, { status: 401 });
  if (!(await getConversation(id, user.id))) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const [cards, messages] = await Promise.all([getConversationCards(id), getMessages(id)]);
  return NextResponse.json({ cards, messages });
}

/** Favori ou suppression depuis le journal. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "no_session" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.favorite !== "boolean") return NextResponse.json({ error: "bad_request" }, { status: 400 });
  await createServiceClient().from("conversations").update({ favorite: body.favorite }).eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "no_session" }, { status: 401 });
  await createServiceClient().from("conversations").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
