import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/admin";
import { RUBRICS, type Article } from "@/lib/magazine";
import { ArticleEditor } from "./ArticleEditor";

export const dynamic = "force-dynamic";

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServiceClient();
  const [{ data }, { data: decks }] = await Promise.all([db.from("articles").select("*").eq("id", id).maybeSingle(), db.from("decks").select("id, name").order("sort")]);
  if (!data) notFound();
  const a = data as Article;
  return (
    <>
      <Link href="/admin/magazine" className="btn-link text-[14px] text-ink-2">
        Tous les articles
      </Link>
      <h1 className="display mt-4 text-[36px] md:text-[44px]">{a.title}</h1>
      <ArticleEditor article={a} decks={(decks ?? []) as { id: string; name: string }[]} rubrics={[...RUBRICS]} />
    </>
  );
}
