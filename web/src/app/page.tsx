import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getSession } from "@/lib/session";
import { getDict } from "@/lib/texts";
import { SITE_ROBOTS } from "@/lib/magazine";
import { Landing } from "@/components/landing/Landing";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://morningcards.vaya.rip";

export async function generateMetadata(): Promise<Metadata> {
  const l = (await getDict(await getLocale())).landing;
  return {
    metadataBase: new URL(SITE),
    title: l.metaTitle,
    description: l.metaDescription,
    // La landing et le Magazine sont les seules pages indexables (sur le domaine définitif).
    robots: SITE_ROBOTS,
    alternates: { canonical: "/" },
    openGraph: { type: "website", url: "/", title: l.metaTitle, description: l.metaDescription, images: [{ url: "/lp/og.jpg", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: l.metaTitle, description: l.metaDescription, images: ["/lp/og.jpg"] },
  };
}

/**
 * Aiguillage : la landing pour une première visite, l'accueil de tirage pour qui
 * a déjà choisi un deck. `?landing` montre la landing à tout le monde (relecture).
 */
export default async function Root({ searchParams }: { searchParams: Promise<{ landing?: string }> }) {
  const [{ profile }, sp, locale] = await Promise.all([getSession(), searchParams, getLocale()]);
  if (profile?.main_deck_id && sp.landing === undefined) redirect("/tirage");
  return <Landing locale={locale} />;
}
