import { requireSession } from "@/lib/session";
import { trialLeft } from "@/lib/plans";
import { quotaReached } from "@/lib/conversation";
import { Toaster } from "@/components/Toast";
import { HomeDraw } from "./HomeDraw";

/** Accueil : le lieu unique pour lancer un tirage. Pleine page : l'arche va d'un bord à l'autre. */
export default async function DrawHome() {
  const { profile, isAnonymous } = await requireSession();
  const quota = await quotaReached(profile, isAnonymous);

  return (
    <main>
      <HomeDraw
        locale={profile.locale}
        firstName={profile.first_name}
        isAnonymous={isAnonymous}
        quota={quota}
        trial={isAnonymous ? null : trialLeft(profile)}
      />
      <Toaster />
    </main>
  );
}
