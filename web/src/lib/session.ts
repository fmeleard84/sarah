import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isLocale, type Locale } from "@/lib/i18n";
import type { PlanId } from "@/lib/plans";

export const LOCALE_COOKIE = "mc_locale";

export interface Profile {
  id: string;
  first_name: string | null;
  birthdate: string | null;
  locale: Locale;
  main_deck_id: string | null;
  plan: PlanId;
  plan_started_at: string;
  extra_cards: number;
  onboarded_at: string | null;
  notify_email: boolean;
}

/** Langue : cookie, sinon navigateur, sinon français. */
export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.toLowerCase().startsWith("en") ? "en" : "fr";
}

/** Session courante : utilisateur (anonyme ou non) et profil. */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, isAnonymous: false };

  const { data: profile } = await createServiceClient().from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { user, profile: profile as Profile | null, isAnonymous: Boolean(user.is_anonymous) };
}

/** Pour les pages de l'app : une session (même anonyme) ayant choisi un deck. */
export async function requireSession() {
  const s = await getSession();
  if (!s.user || !s.profile) redirect("/bienvenue");
  if (!s.profile.main_deck_id) redirect("/bienvenue");
  return s as { user: NonNullable<typeof s.user>; profile: Profile; isAnonymous: boolean };
}

/** Pour les pages réservées aux comptes créés (journal, profil). */
export async function requireAccount() {
  const s = await requireSession();
  if (s.isAnonymous) redirect("/inscription");
  return s;
}
