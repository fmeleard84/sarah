import "server-only";
import Stripe from "stripe";

/**
 * Paiement Stripe. Sans `STRIPE_SECRET_KEY`, l'application reste en mode
 * « bientôt » : /api/checkout répond 501 et le paywall l'annonce.
 */
let client: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://morningcards.vaya.rip";
