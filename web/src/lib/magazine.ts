import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";
import type { Locale } from "@/lib/i18n";

/** Rubriques du Magazine (brief de Sarah). */
export const RUBRICS = ["Decks & Artistes", "Morning Sessions", "Behind the Scenes"] as const;

export interface Article {
  id: string;
  slug: string;
  locale: Locale;
  rubric: string;
  title: string;
  excerpt: string;
  cover_path: string | null;
  cover_alt: string;
  news: string;
  body: string;
  deck_id: string | null;
  is_published: boolean;
  published_at: string;
  updated_on: string | null;
  created_at: string;
  updated_at: string;
}

/** Articles publiés d'une langue, du plus récent au plus ancien. */
export async function listArticles(locale: Locale): Promise<Article[]> {
  const { data } = await createServiceClient()
    .from("articles")
    .select("*")
    .eq("is_published", true)
    .eq("locale", locale)
    .order("published_at", { ascending: false });
  return (data ?? []) as Article[];
}

export async function hasPublishedArticles(locale: Locale): Promise<boolean> {
  const { count } = await createServiceClient().from("articles").select("id", { count: "exact", head: true }).eq("is_published", true).eq("locale", locale);
  return (count ?? 0) > 0;
}

/** Un article publié ; `preview` laisse l'admin relire un brouillon. */
export async function getArticle(slug: string, preview = false): Promise<Article | null> {
  let q = createServiceClient().from("articles").select("*").eq("slug", slug);
  if (!preview) q = q.eq("is_published", true);
  const { data } = await q.maybeSingle();
  return data as Article | null;
}

/** Date longue, « 7 juin 2026 ». */
export const formatDate = (d: string, locale: Locale) =>
  new Date(`${d}T12:00:00`).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });

/**
 * Corps d'article : texte simple, sans HTML. Un paragraphe par bloc séparé d'une
 * ligne vide. Une ligne qui commence par « > » est une phrase d'exergue, « ## » un
 * intertitre, et « ![légende](/chemin) » une image.
 */
export type Block = { kind: "p" | "quote" | "h2"; text: string } | { kind: "img"; src: string; alt: string };

export function parseBody(body: string): Block[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b): Block => {
      const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(b);
      if (img && /^(\/|https:\/\/)/.test(img[2])) return { kind: "img", alt: img[1], src: img[2] };
      if (b.startsWith(">")) return { kind: "quote", text: b.replace(/^>\s?/gm, "") };
      if (b.startsWith("## ")) return { kind: "h2", text: b.slice(3) };
      return { kind: "p", text: b };
    });
}

/**
 * Landing et Magazine indexables seulement sur le domaine définitif
 * (`SITE_INDEXABLE=1` dans .env.local) : la recette reste hors des moteurs.
 */
export const SITE_ROBOTS = process.env.SITE_INDEXABLE === "1" ? { index: true, follow: true } : { index: false, follow: false };
