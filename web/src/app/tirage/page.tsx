import { requireSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { effectivePlan, explorationDaysLeft } from "@/lib/plans";
import { quotaReached } from "@/lib/conversation";
import { AppShell } from "@/components/AppShell";
import { HomeDraw } from "./HomeDraw";

/** Accueil : le lieu unique pour lancer un tirage. */
export default async function DrawHome() {
  const { profile, isAnonymous } = await requireSession();
  const locale = profile.locale;
  const { data: deck } = await createServiceClient().from("decks").select("name, slug").eq("id", profile.main_deck_id!).single();
  const plan = effectivePlan(profile);
  const quota = await quotaReached(profile, isAnonymous);

  const content = (
    <HomeDraw
      locale={locale}
      firstName={profile.first_name}
      deckName={deck?.name ?? ""}
      spreads={plan.spreads}
      isAnonymous={isAnonymous}
      quota={quota}
      daysLeft={isAnonymous ? null : explorationDaysLeft(profile)}
    />
  );

  // Pendant l'onboarding, pas de navigation : on ne sort pas avant d'avoir un compte.
  if (isAnonymous) return <main className="min-h-dvh px-[10%] pt-[max(env(safe-area-inset-top),20px)]">{content}</main>;
  return (
    <AppShell locale={locale} firstName={profile.first_name}>
      {content}
    </AppShell>
  );
}
