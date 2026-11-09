import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { periodStart } from "@/lib/plans";

export const dynamic = "force-dynamic";

/** Vue d'ensemble : quelques chiffres et les raccourcis vers chaque rubrique. */
export default async function AdminHome() {
  const db = createServiceClient();
  const head = { count: "exact" as const, head: true };
  const today = periodStart("day").toISOString();
  const [accounts, convs, convsToday, messages, decks, texts] = await Promise.all([
    db.from("profiles").select("id", head).not("onboarded_at", "is", null),
    db.from("conversations").select("id", head),
    db.from("conversations").select("id", head).gte("created_at", today),
    db.from("messages").select("id", head).eq("role", "user"),
    db.from("decks").select("is_published"),
    db.from("ui_texts").select("key", head),
  ]);
  const published = (decks.data ?? []).filter((d) => d.is_published).length;

  const stats = [
    { label: "Comptes créés", value: accounts.count ?? 0 },
    { label: "Conversations", value: convs.count ?? 0 },
    { label: "Conversations aujourd'hui", value: convsToday.count ?? 0 },
    { label: "Messages envoyés", value: messages.count ?? 0 },
  ];

  const sections = [
    {
      href: "/admin/mesure",
      title: "mesure.",
      body: "Le test marché : visiteurs (A), visiteurs qui tirent une carte (B), comptes créés (C), par source et jour par jour.",
    },
    {
      href: "/admin/decks",
      title: "decks et cartes.",
      body: `${published} deck${published > 1 ? "s" : ""} publié${published > 1 ? "s" : ""} sur ${decks.data?.length ?? 0}. Remplacer l'image d'une carte, modifier une description, créer un deck, choisir ce qui est ouvert aux offres gratuites.`,
    },
    {
      href: "/admin/arcanes",
      title: "arcanes.",
      body: "Les noms des 22 arcanes majeurs, en français et en anglais, communs à tous les decks.",
    },
    {
      href: "/admin/textes",
      title: "textes et traductions.",
      body: `Tous les textes de l'application, en français et en anglais, avec traduction automatique. ${texts.count ?? 0} texte${(texts.count ?? 0) > 1 ? "s" : ""} modifié${(texts.count ?? 0) > 1 ? "s" : ""}.`,
    },
    {
      href: "/admin/utilisatrices",
      title: "utilisatrices.",
      body: "Les comptes, leur offre, leurs cartes en réserve, et les accès à cette administration.",
    },
  ];

  return (
    <>
      <h1 className="display text-[44px] md:text-[56px]">administration.</h1>

      <dl className="mt-10 grid grid-cols-2 gap-px border border-rule bg-rule md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-canvas p-5">
            <dt className="label text-ink-3">{s.label}</dt>
            <dd className="title mt-3 text-[40px] tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-14 grid gap-x-12 md:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="group border-t border-rule py-7">
            <h2 className="title text-[28px] transition-colors group-hover:text-slate">{s.title}</h2>
            <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed text-ink-2">{s.body}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
