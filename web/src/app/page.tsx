import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

/** Aiguillage : onboarding pour une première visite, sinon l'accueil de tirage. */
export default async function Root() {
  const { profile } = await getSession();
  redirect(profile?.main_deck_id ? "/tirage" : "/bienvenue");
}
