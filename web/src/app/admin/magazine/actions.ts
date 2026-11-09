"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin, slugify } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/admin";
import { RUBRICS } from "@/lib/magazine";

type Result = { ok: true } | { ok: false; error: string };
const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : String(e) });
const refresh = () => {
  revalidatePath("/magazine", "layout");
  revalidatePath("/");
};

/** Nouvel article, en brouillon. */
export async function createArticle(title: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await assertAdmin();
    const clean = title.trim();
    if (!clean) return { ok: false, error: "Le titre est obligatoire." };
    const base = slugify(clean).slice(0, 80) || "article";
    const db = createServiceClient();
    const { data: taken } = await db.from("articles").select("slug").like("slug", `${base}%`);
    const used = new Set((taken ?? []).map((r) => r.slug));
    let slug = base;
    for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;
    const { data, error } = await db.from("articles").insert({ title: clean, slug, rubric: RUBRICS[1] }).select("id").single();
    if (error) throw error;
    return { ok: true, id: data.id };
  } catch (e) {
    return fail(e) as { ok: false; error: string };
  }
}

export interface ArticleInput {
  id: string;
  slug: string;
  locale: "fr" | "en";
  rubric: string;
  title: string;
  excerpt: string;
  cover_path: string;
  cover_alt: string;
  news: string;
  body: string;
  deck_id: string;
  is_published: boolean;
  published_at: string;
  updated_on: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function saveArticle(a: ArticleInput): Promise<Result> {
  try {
    await assertAdmin();
    if (!a.title.trim()) return { ok: false, error: "Le titre est obligatoire." };
    const slug = slugify(a.slug);
    if (!slug) return { ok: false, error: "L'adresse (slug) est obligatoire." };
    if (!DATE.test(a.published_at)) return { ok: false, error: "Date de publication invalide." };
    if (a.updated_on && !DATE.test(a.updated_on)) return { ok: false, error: "Date de mise à jour invalide." };
    if (a.is_published && !a.cover_path) return { ok: false, error: "Ajoute une image de couverture avant de publier." };
    if (a.cover_path && !/^(\/|https:\/\/)/.test(a.cover_path)) return { ok: false, error: "Adresse d'image invalide." };
    const { error } = await createServiceClient()
      .from("articles")
      .update({
        slug,
        locale: a.locale,
        rubric: a.rubric.trim() || RUBRICS[1],
        title: a.title.trim(),
        excerpt: a.excerpt.trim(),
        cover_path: a.cover_path || null,
        cover_alt: a.cover_alt.trim(),
        news: a.news.trim(),
        body: a.body.trim(),
        deck_id: a.deck_id || null,
        is_published: a.is_published,
        published_at: a.published_at,
        updated_on: a.updated_on || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", a.id);
    if (error) return { ok: false, error: error.code === "23505" ? "Cette adresse est déjà prise par un autre article." : error.message };
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteArticle(id: string): Promise<Result> {
  try {
    await assertAdmin();
    const { error } = await createServiceClient().from("articles").delete().eq("id", id);
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
