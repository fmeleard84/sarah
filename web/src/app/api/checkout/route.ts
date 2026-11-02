import { NextResponse } from "next/server";

/**
 * Paiement : pas encore branché (prestataire à choisir, Stripe par défaut).
 * Le paywall l'appelle déjà ; il affiche « bientôt » tant que la réponse est 501.
 */
export function POST() {
  return NextResponse.json({ error: "payments_not_ready" }, { status: 501 });
}
