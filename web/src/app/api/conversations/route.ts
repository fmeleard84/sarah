import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { startConversation } from "@/lib/conversation";
import { track } from "@/lib/track";

/** Ouvre une conversation : tire les cartes du tirage initial. */
export async function POST(req: Request) {
  const { user, profile, isAnonymous } = await getSession();
  if (!user || !profile?.main_deck_id) return NextResponse.json({ error: "no_session" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const spread = [1, 3, 5].includes(body.spread) ? (body.spread as 1 | 3 | 5) : 1;

  const result = await startConversation(profile, spread, isAnonymous);
  if ("refused" in result) return NextResponse.json(result.refused, { status: 402 });
  await track("draw", user.id);
  return NextResponse.json(result);
}
