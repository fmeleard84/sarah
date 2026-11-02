import { NextResponse } from "next/server";
import { getLocale, getSession } from "@/lib/session";
import { buildContext, canSendMessage, getConversation } from "@/lib/conversation";
import { ANONYMOUS_USER_MESSAGES, effectivePlan } from "@/lib/plans";
import { cleanText, completeChat, streamChat, type ChatMessage } from "@/lib/llm";
import { DRAW_CARD_TOKEN, SUMMARY_INSTRUCTION, revealInstruction } from "@/lib/prompt";
import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Fait parler l'IA, en flux de texte brut.
 *
 * Deux usages :
 * - { reveal: position } : texte d'accueil d'une carte qui vient d'être révélée ;
 * - { message } : réponse à un message de l'utilisatrice.
 *
 * La réponse est enregistrée à la fin du flux. Le jeton [[DRAW_CARD]] est
 * conservé en base (le client s'en sert pour proposer une carte) mais retiré
 * de l'historique envoyé au modèle.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user, profile, isAnonymous } = await getSession();
  if (!user || !profile) return NextResponse.json({ error: "no_session" }, { status: 401 });

  const conv = await getConversation(id, user.id);
  if (!conv) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const locale = profile.locale ?? (await getLocale());
  const plan = effectivePlan(profile);
  const { system, cards, promptCards, messages } = await buildContext(profile, id, plan, locale);
  const db = createServiceClient();

  // Historique pour le modèle : chaque texte d'accueil est précédé de la
  // consigne de révélation qui l'a produit.
  const history: ChatMessage[] = [];
  for (const m of messages) {
    if (m.kind === "reveal" && m.card_position !== null) {
      const c = promptCards[m.card_position];
      if (c) history.push({ role: "user", content: revealInstruction(c, m.card_position === 0, locale) });
    }
    history.push({ role: m.role, content: m.content.replace(DRAW_CARD_TOKEN, "").trim() });
  }

  let kind: "text" | "reveal" = "text";
  let cardPosition: number | null = null;

  if (typeof body.reveal === "number") {
    const c = promptCards[body.reveal];
    if (!c) return NextResponse.json({ error: "no_card" }, { status: 400 });
    if (messages.some((m) => m.kind === "reveal" && m.card_position === body.reveal)) {
      return NextResponse.json({ error: "already_revealed" }, { status: 409 });
    }
    // Les cartes d'un tirage multiple sont accueillies dans l'ordre.
    const revealed = new Set(messages.filter((m) => m.kind === "reveal").map((m) => m.card_position));
    if (cards.some((k) => k.position < body.reveal && !revealed.has(k.position))) {
      return NextResponse.json({ error: "out_of_order" }, { status: 409 });
    }
    kind = "reveal";
    cardPosition = body.reveal;
    history.push({ role: "user", content: revealInstruction(c, body.reveal === 0, locale) });
  } else {
    const text = String(body.message ?? "").trim().slice(0, 2000);
    if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

    const userCount = messages.filter((m) => m.role === "user").length;
    if (isAnonymous && userCount >= ANONYMOUS_USER_MESSAGES) {
      return NextResponse.json({ reason: "signup_required" }, { status: 402 });
    }
    if (!canSendMessage(cards, userCount)) return NextResponse.json({ reason: "message_limit" }, { status: 402 });

    await db.from("messages").insert({ conversation_id: id, role: "user", content: text });
    history.push({ role: "user", content: text });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        for await (const delta of streamChat([{ role: "system", content: system }, ...history])) {
          full += delta;
          controller.enqueue(encoder.encode(delta));
        }
      } catch (e) {
        console.error("[stream]", e);
        controller.enqueue(encoder.encode("\n[[ERROR]]"));
        controller.close();
        return;
      }

      const content = cleanText(full);
      if (content) {
        await db.from("messages").insert({ conversation_id: id, role: "assistant", kind, card_position: cardPosition, content });
        await db.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", id);
      }
      controller.close();

      // Mémoire et titre du journal, hors du flux.
      const userCount = history.filter((m) => m.role === "user" && !m.content.startsWith("[")).length;
      if (kind === "text" && (userCount === 1 || userCount % 3 === 0)) {
        summarize(id, [...history, { role: "assistant", content }]).catch((e) => console.error("[summary]", e));
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}

async function summarize(conversationId: string, history: ChatMessage[]) {
  const transcript = history
    .filter((m) => !m.content.startsWith("["))
    .map((m) => `${m.role === "user" ? "Personne" : "Morning Cards"} : ${m.content}`)
    .join("\n");
  const raw = await completeChat([
    { role: "system", content: SUMMARY_INSTRUCTION },
    { role: "user", content: transcript.slice(-12000) },
  ]);
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  const summary = JSON.parse(json);
  await createServiceClient()
    .from("conversations")
    .update({ summary, title: typeof summary.title === "string" ? cleanText(summary.title).slice(0, 80) : null })
    .eq("id", conversationId);
}
