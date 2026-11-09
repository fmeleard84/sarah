import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { track } from "@/lib/track";

/**
 * Visite (le A de la mesure), envoyée par le navigateur une fois par onglet.
 * Exiger JavaScript écarte déjà la plupart des robots.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Le référent n'a d'intérêt que s'il vient d'un autre site.
  let referrer = str(body.referrer);
  try {
    if (referrer && new URL(referrer).host === new URL(req.url).host) referrer = undefined;
    if (referrer && new URL(referrer).host === req.headers.get("host")) referrer = undefined;
  } catch {
    referrer = undefined;
  }

  await track("visit", user?.id ?? null, {
    path: str(body.path),
    referrer,
    utm_source: str(body.utm_source),
    utm_medium: str(body.utm_medium),
    utm_campaign: str(body.utm_campaign),
  });
  return NextResponse.json({ ok: true });
}
