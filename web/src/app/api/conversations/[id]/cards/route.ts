import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { drawExtraCard, getConversation } from "@/lib/conversation";

/** Tire une carte supplémentaire dans la conversation. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user, profile, isAnonymous } = await getSession();
  if (!user || !profile) return NextResponse.json({ error: "no_session" }, { status: 401 });
  if (!(await getConversation(id, user.id))) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const result = await drawExtraCard(profile, id, isAnonymous);
  if ("refused" in result) return NextResponse.json(result.refused, { status: 402 });
  return NextResponse.json(result);
}
