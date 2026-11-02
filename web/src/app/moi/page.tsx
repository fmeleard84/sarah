import { requireAccount } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { listArcana } from "@/lib/decks";
import { effectivePlan } from "@/lib/plans";
import { lifePath } from "@/lib/numerology";
import { AppShell } from "@/components/AppShell";
import { ProfileView } from "./ProfileView";

/** Profil : cartes les plus tirées, chemin de vie, réglages. */
export default async function Me() {
  const { user, profile } = await requireAccount();
  const db = createServiceClient();
  const [{ data: drawn }, { count: convs }, arcana] = await Promise.all([
    db.from("conversation_cards").select("card:cards(arcana, image_path), conversations!inner(user_id)").eq("conversations.user_id", user.id),
    db.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    listArcana(),
  ]);
  const locale = profile.locale;

  const tally = new Map<number, { count: number; image: string }>();
  ((drawn ?? []) as unknown as { card: { arcana: number; image_path: string } }[]).forEach(({ card }) => {
    const cur = tally.get(card.arcana);
    tally.set(card.arcana, { count: (cur?.count ?? 0) + 1, image: cur?.image ?? `${card.image_path}-sm.webp` });
  });
  const top = [...tally.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([n, v]) => ({ name: locale === "en" ? arcana[n].name_en : arcana[n].name_fr, image: v.image, count: v.count }));

  return (
    <AppShell locale={locale} firstName={profile.first_name}>
      <ProfileView
        locale={locale}
        email={user.email ?? ""}
        firstName={profile.first_name ?? ""}
        birthdate={profile.birthdate ?? ""}
        notifyEmail={profile.notify_email}
        plan={effectivePlan(profile).id}
        lifePath={lifePath(profile.birthdate)}
        stats={{ cards: drawn?.length ?? 0, convs: convs ?? 0 }}
        top={top}
      />
    </AppShell>
  );
}
