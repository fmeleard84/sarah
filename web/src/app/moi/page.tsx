import { cookies } from "next/headers";
import { requireAccount } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { listArcana } from "@/lib/decks";
import { effectivePlan } from "@/lib/plans";
import { lifePath } from "@/lib/numerology";
import { THEME_COOKIE, isTheme } from "@/lib/theme";
import { AppShell } from "@/components/AppShell";
import { ProfileView, type Draw } from "./ProfileView";

/** Profil en trois onglets : tirages, toi, réglages. */
export default async function Me() {
  const { user, profile } = await requireAccount();
  const db = createServiceClient();
  const [{ data: drawn }, { count: convs }, arcana, jar] = await Promise.all([
    db
      .from("conversation_cards")
      .select("card:cards(arcana, image_path, decks(slug)), conversations!inner(user_id, created_at)")
      .eq("conversations.user_id", user.id),
    db.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    listArcana(),
    cookies(),
  ]);
  const locale = profile.locale;
  const rows = (drawn ?? []) as unknown as { card: { arcana: number; image_path: string; decks: { slug: string } }; conversations: { created_at: string } }[];
  const draws: Draw[] = rows.map(({ card, conversations }) => ({
    arcana: card.arcana,
    name: locale === "en" ? arcana[card.arcana].name_en : arcana[card.arcana].name_fr,
    image: `${card.image_path}-sm.webp`,
    href: `/decks/${card.decks.slug}/${card.arcana}`,
    date: conversations.created_at,
  }));
  const theme = jar.get(THEME_COOKIE)?.value;

  return (
    <AppShell locale={locale} firstName={profile.first_name}>
      <ProfileView
        locale={locale}
        email={user.email ?? ""}
        isAdmin={profile.is_admin}
        firstName={profile.first_name ?? ""}
        birthdate={profile.birthdate ?? ""}
        notifyEmail={profile.notify_email}
        plan={effectivePlan(profile).id}
        hasBilling={Boolean(profile.stripe_customer_id)}
        lifePath={lifePath(profile.birthdate)}
        world={profile.world ?? {}}
        theme={isTheme(theme) ? theme : "light"}
        stats={{ cards: rows.length, convs: convs ?? 0 }}
        draws={draws}
      />
    </AppShell>
  );
}
