import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getSession } from "@/lib/session";
import { getDict } from "@/lib/texts";
import { formatDate, getArticle, parseBody, SITE_ROBOTS } from "@/lib/magazine";
import { cardImage } from "@/lib/decks";
import { createServiceClient } from "@/lib/supabase/admin";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://morningcards.vaya.rip";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ from?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getArticle((await params).slug);
  if (!a) return {};
  return {
    metadataBase: new URL(SITE),
    title: `${a.title} · Morning Cards`,
    description: a.excerpt || undefined,
    robots: SITE_ROBOTS,
    alternates: { canonical: `/magazine/${a.slug}` },
    openGraph: { type: "article", title: a.title, description: a.excerpt || undefined, images: a.cover_path ? [a.cover_path] : undefined },
  };
}

/**
 * Article. Le retour dépend de la provenance (?from=deck : retour au deck), le
 * bloc « Le Deck » mène au deck lié : sa fiche pour un compte, sinon le premier
 * tirage avec ce deck présélectionné. L'admin peut relire un brouillon.
 */
export default async function ArticlePage({ params, searchParams }: Props) {
  const [{ slug }, { from }, session, locale] = await Promise.all([params, searchParams, getSession(), getLocale()]);
  const isAdmin = Boolean(session.profile?.is_admin && !session.isAnonymous);
  const a = await getArticle(slug, isAdmin);
  if (!a) notFound();
  const t = (await getDict(locale)).magazine;

  let deck: { slug: string; name: string; description: string; image: string | null } | null = null;
  if (a.deck_id) {
    const db = createServiceClient();
    const { data: d } = await db.from("decks").select("id, slug, name, description_fr, description_en, cover_arcana, is_published").eq("id", a.deck_id).maybeSingle();
    if (d?.is_published) {
      const { data: c } = await db.from("cards").select("image_path").eq("deck_id", d.id).eq("arcana", d.cover_arcana).maybeSingle();
      deck = { slug: d.slug, name: d.name, description: locale === "en" ? d.description_en : d.description_fr, image: c ? cardImage(c.image_path, true) : null };
    }
  }
  const hasAccount = Boolean(session.user && !session.isAnonymous);
  const deckHref = deck ? (hasAccount ? `/decks/${deck.slug}` : `/bienvenue?deck=${deck.slug}`) : null;
  const fromDeck = from === "deck" && deck && hasAccount;

  return (
    <>
      {!a.is_published && <p className="mg-draft">{t.draft}</p>}
      <Link href={fromDeck ? `/decks/${deck!.slug}` : "/magazine"} className="mg-back">
        <span aria-hidden="true">‹</span> {fromDeck ? deck!.name : t.back}
      </Link>
      <article className="mg-article">
        <div className="mg-cover">{a.cover_path && <img src={a.cover_path} alt={a.cover_alt} fetchPriority="high" />}</div>
        <div className="mg-body">
          <p className="mg-caps">{a.rubric}</p>
          <h1>{a.title}</h1>
          <p className="mg-date">{formatDate(a.published_at, locale)}</p>
          {a.updated_on && <p className="mg-updated mg-it">{t.updated(formatDate(a.updated_on, locale))}</p>}

          {a.news && (
            <aside className="mg-news">
              <p className="mg-caps">{t.news}</p>
              <p>{a.news}</p>
            </aside>
          )}

          <div className="mg-text">
            {parseBody(a.body).map((b, i) =>
              b.kind === "img" ? (
                <figure key={i}>
                  <img src={b.src} alt={b.alt} loading="lazy" decoding="async" />
                  {b.alt && <figcaption>{b.alt}</figcaption>}
                </figure>
              ) : b.kind === "quote" ? (
                <blockquote key={i}>{b.text}</blockquote>
              ) : b.kind === "h2" ? (
                <h2 key={i}>{b.text}</h2>
              ) : (
                <p key={i}>{b.text}</p>
              ),
            )}
          </div>

          {deck && deckHref && (
            <section className="mg-deck">
              <p className="mg-caps">{t.deckLabel}</p>
              <h2>{deck.name}</h2>
              {deck.description && <p>{deck.description}</p>}
              {deck.image && (
                <div className="card">
                  <img src={deck.image} alt="" loading="lazy" />
                </div>
              )}
              <Link href={deckHref} className="mg-cta">
                {t.deckCta(deck.name)}
              </Link>
            </section>
          )}
          <Link href="/magazine" className="mg-back" style={{ padding: "40px 0 0" }}>
            <span aria-hidden="true">‹</span> {t.backLong}
          </Link>
        </div>
      </article>
    </>
  );
}
