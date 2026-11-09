import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/admin";
import { PACKS, type PlanId } from "@/lib/plans";

/**
 * Seule porte d'entrée du plan et des crédits. La signature prouve que
 * l'événement vient de Stripe ; `stripe_events` évite de traiter deux fois un
 * événement rejoué (un pack serait crédité en double).
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "payments_not_ready" }, { status: 501 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  const db = createServiceClient();
  const { error: seen } = await db.from("stripe_events").insert({ id: event.id, type: event.type });
  if (seen) {
    if (seen.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    return NextResponse.json({ error: "db" }, { status: 500 });
  }

  try {
    if (event.type === "checkout.session.completed") await onCheckout(event.data.object);
    if (event.type === "customer.subscription.deleted") await onSubscriptionEnded(event.data.object);
    if (event.type === "customer.subscription.updated") await onSubscriptionUpdated(event.data.object);
  } catch (e) {
    // Stripe rejouera l'événement : on retire la trace pour qu'il soit retraité.
    console.error("[stripe]", event.type, e);
    await db.from("stripe_events").delete().eq("id", event.id);
    return NextResponse.json({ error: "handler" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

const asId = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : (v?.id ?? null));

/** Une écriture ratée doit remonter : Stripe rejouera l'événement, le paiement n'est pas perdu. */
function must({ error }: { error: { message: string } | null }) {
  if (error) throw new Error(error.message);
}

async function onCheckout(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id ?? session.client_reference_id;
  const item = session.metadata?.item;
  if (!userId || !item) return;
  const db = createServiceClient();
  const customer = asId(session.customer);

  if (item === "ritual" || item === "clarity") {
    must(
      await db
        .from("profiles")
        .update({
          plan: item as PlanId,
          plan_started_at: new Date().toISOString(),
          stripe_customer_id: customer,
          stripe_subscription_id: asId(session.subscription),
        })
        .eq("id", userId),
    );
    return;
  }

  const pack = PACKS.find((p) => p.id === item);
  if (!pack) return;
  const { data, error } = await db.from("profiles").select("extra_cards").eq("id", userId).single();
  if (error) throw new Error(error.message);
  must(
    await db
      .from("profiles")
      .update({ extra_cards: data.extra_cards + pack.cards, ...(customer ? { stripe_customer_id: customer } : {}) })
      .eq("id", userId),
  );
}

/** Abonnement terminé : retour à l'offre gratuite, sans limite de durée. */
async function onSubscriptionEnded(sub: Stripe.Subscription) {
  must(
    await createServiceClient()
      .from("profiles")
      .update({ plan: "intention", plan_started_at: new Date().toISOString(), stripe_subscription_id: null, use_my_deck: false })
      .eq("stripe_subscription_id", sub.id),
  );
}

/** Changement d'offre depuis le portail Stripe, identifié par le montant mensuel. */
async function onSubscriptionUpdated(sub: Stripe.Subscription) {
  if (sub.status === "unpaid" || sub.status === "canceled") return onSubscriptionEnded(sub);
  const cents = sub.items.data[0]?.price?.unit_amount;
  const plan = cents === 1100 ? "ritual" : cents === 1500 ? "clarity" : null;
  if (plan) must(await createServiceClient().from("profiles").update({ plan }).eq("stripe_subscription_id", sub.id));
}
