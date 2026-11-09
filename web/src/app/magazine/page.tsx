import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/session";
import { getDict } from "@/lib/texts";
import { formatDate, listArticles, SITE_ROBOTS } from "@/lib/magazine";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict(await getLocale());
  return { title: `${t.magazine.title} · Morning Cards`, description: t.magazine.metaDescription, robots: SITE_ROBOTS, alternates: { canonical: "/magazine" } };
}

/** Magazine : les articles publiés, du plus récent au plus ancien. */
export default async function Magazine() {
  const locale = await getLocale();
  const [t, articles] = await Promise.all([getDict(locale), listArticles(locale)]);
  if (!articles.length) return <p className="mg-empty mg-it">{t.magazine.empty}</p>;
  return (
    <main className="mg-list">
      {articles.map((a, i) => (
        <Link key={a.id} href={`/magazine/${a.slug}`} className="mg-card">
          <div className="cover">{a.cover_path && <img src={a.cover_path} alt={a.cover_alt} loading={i < 2 ? "eager" : "lazy"} decoding="async" />}</div>
          <div className="meta">
            <p className="mg-caps">{a.rubric}</p>
            <h2>{a.title}</h2>
            {a.excerpt && <p className="ex">{a.excerpt}</p>}
            <p className="mg-date">{formatDate(a.published_at, locale)}</p>
          </div>
        </Link>
      ))}
    </main>
  );
}
