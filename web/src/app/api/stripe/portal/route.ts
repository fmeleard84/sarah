import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getStripe, siteUrl } from "@/lib/stripe";

/** Portail Stripe : gérer ou résilier son abonnement. */
export async function POST() {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "payments_not_ready" }, { status: 501 });
  const { profile, isAnonymous } = await getSession();
  if (!profile?.stripe_customer_id || isAnonymous) return NextResponse.json({ error: "no_customer" }, { status: 400 });
  const portal = await stripe.billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${siteUrl()}/moi` });
  return NextResponse.json({ url: portal.url });
}
