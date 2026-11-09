import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import type { Article } from "@/lib/magazine";
import { NewArticle } from "./NewArticle";

export const dynamic = "force-dynamic";

/** Magazine : tous les articles, brouillons compris. */
export default async function AdminMagazine() {
  const { data } = await createServiceClient().from("articles").select("*").order("published_at", { ascending: false });
  const articles = (data ?? []) as Article[];
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="display text-[44px] md:text-[56px]">magazine.</h1>
        <NewArticle />
      </div>
      <p className="mt-4 max-w-[70ch] text-[14px] leading-relaxed text-ink-2">
        Les articles publiés apparaissent sur <Link href="/magazine" className="btn-link text-[14px]">/magazine</Link>, et le lien Magazine s&apos;affiche alors sur la landing. Un
        brouillon se relit à son adresse, visible par l&apos;administration seulement.
      </p>
      {articles.length === 0 ? (
        <p className="mt-10 text-[14px] text-ink-3">Aucun article pour l&apos;instant.</p>
      ) : (
        <ul className="mt-10 border-t border-rule">
          {articles.map((a) => (
            <li key={a.id} className="border-b border-rule">
              <Link href={`/admin/magazine/${a.id}`} className="flex flex-wrap items-baseline justify-between gap-4 py-4 hover:bg-surface">
                <span>
                  <span className="label mr-3 text-ink-3">{a.rubric}</span>
                  <span className="text-[16px]">{a.title}</span>
                </span>
                <span className="text-[13px] text-ink-3">
                  {a.locale.toUpperCase()} · {a.published_at} · {a.is_published ? "publié" : "brouillon"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
