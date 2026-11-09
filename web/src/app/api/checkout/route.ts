import { NextResponse } from "next/server";
import { getLocale, getSession } from "@/lib/session";
import { getStripe, siteUrl } from "@/lib/stripe";
import { PACKS, PLANS } from "@/lib/plans";

/**
 * Ouvre une page de paiement Stripe pour une offre ou un pack.
 * Sans clé Stripe, répond 501 et le paywall affiche « bientôt ».
 * L'offre et les crédits ne changent qu'au webhook, jamais ici.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "payments_not_ready" }, { status: 501 });

  const { user, profile, isAnonymous } = await getSession();
  if (!user || !profile || isAnonymous) return NextResponse.json({ error: "account_required" }, { status: 401 });

  const { item } = await req.json().catch(() => ({ item: null }));
  const plan = item === "ritual" || item === "clarity" ? PLANS[item as "ritual" | "clarity"] : null;
  const pack = PACKS.find((p) => p.id === item);
  if (!plan && !pack) return NextResponse.json({ error: "unknown_item" }, { status: 400 });

  const base = siteUrl();

  // Un abonnement existe déjà : le changement d'offre passe par le portail Stripe.
  if (plan && profile.stripe_subscription_id && profile.stripe_customer_id) {
    const portal = await stripe.billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${base}/moi` });
    return NextResponse.json({ url: portal.url });
  }

  const name = plan ? `Morning Cards ${plan.id === "ritual" ? "Ritual" : "Clarity"}` : `Morning Cards, ${pack!.cards} carte${pack!.cards > 1 ? "s" : ""}`;
  const priceEur = plan ? plan.priceEur! : pack!.priceEur;
  const metadata = { user_id: user.id, item: String(item) };

  try {
    const session = await stripe.checkout.sessions.create({
    mode: plan ? "subscription" : "payment",
    locale: (await getLocale()) === "en" ? "en" : "fr",
    client_reference_id: user.id,
    ...(profile.stripe_customer_id ? { customer: profile.stripe_customer_id } : { customer_email: user.email }),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(priceEur * 100),
          product_data: { name },
          ...(plan ? { recurring: { interval: "month" as const } } : {}),
        },
      },
    ],
    metadata,
    ...(plan ? { subscription_data: { metadata } } : {}),
    success_url: `${base}/offres?paiement=ok`,
    cancel_url: `${base}/offres`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[checkout]", e);
    return NextResponse.json({ error: "stripe" }, { status: 502 });
  }
}
