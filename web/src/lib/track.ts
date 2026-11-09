import "server-only";
import { cookies, headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Mesure du test marché : A (visiteurs), B (visiteurs qui tirent), C (inscrits).
 * Le visiteur est identifié par le cookie `mc_vid`, posé par le proxy.
 * `mc_notrack` (posé en ouvrant l'admin, ou par les scripts de recette)
 * exclut un navigateur des chiffres. Voir /admin/mesure.
 */
export const VISITOR_COOKIE = "mc_vid";
export const NOTRACK_COOKIE = "mc_notrack";

export type EventName = "visit" | "draw" | "signup";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor|curl|wget|python|node-fetch|axios/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Extra {
  path?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

/** Enregistre un événement. Ne lève jamais : la mesure ne doit pas casser le parcours. */
export async function track(name: EventName, userId: string | null, extra: Extra = {}) {
  try {
    const [jar, h] = await Promise.all([cookies(), headers()]);
    if (jar.get(NOTRACK_COOKIE)) return;
    if (BOT.test(h.get("user-agent") ?? "")) return;
    const vid = jar.get(VISITOR_COOKIE)?.value;
    const visitorId = vid && UUID.test(vid) ? vid : userId;
    if (!visitorId) return;
    const cut = (v: string | undefined, n: number) => (v ? v.slice(0, n) : null);
    const { error } = await createServiceClient()
      .from("events")
      .insert({
        visitor_id: visitorId,
        user_id: userId,
        name,
        path: cut(extra.path, 200),
        referrer: cut(extra.referrer, 300),
        utm_source: cut(extra.utm_source, 100),
        utm_medium: cut(extra.utm_medium, 100),
        utm_campaign: cut(extra.utm_campaign, 100),
      });
    if (error) console.error("[track]", name, error.message);
  } catch (e) {
    console.error("[track]", name, e);
  }
}
