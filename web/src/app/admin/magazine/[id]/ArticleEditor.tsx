"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "@/components/Toast";
import type { Article } from "@/lib/magazine";
import { deleteArticle, saveArticle, type ArticleInput } from "../actions";

async function upload(file: File): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/magazine-image", { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    toast(json.error ?? "Envoi impossible.");
    return null;
  }
  return json.url as string;
}

/** Édition d'un article du Magazine : champs du brief (rubrique, dates, encart actu, corps, deck lié). */
export function ArticleEditor({ article, decks, rubrics }: { article: Article; decks: { id: string; name: string }[]; rubrics: string[] }) {
  const router = useRouter();
  const [a, setA] = useState<ArticleInput>({
    id: article.id,
    slug: article.slug,
    locale: article.locale,
    rubric: article.rubric,
    title: article.title,
    excerpt: article.excerpt,
    cover_path: article.cover_path ?? "",
    cover_alt: article.cover_alt,
    news: article.news,
    body: article.body,
    deck_id: article.deck_id ?? "",
    is_published: article.is_published,
    published_at: article.published_at,
    updated_on: article.updated_on ?? "",
  });
  const [busy, setBusy] = useState(false);
  const body = useRef<HTMLTextAreaElement>(null);
  const set = <K extends keyof ArticleInput>(k: K, v: ArticleInput[K]) => setA((x) => ({ ...x, [k]: v }));

  async function save() {
    setBusy(true);
    const res = await saveArticle(a);
    setBusy(false);
    if (!res.ok) return toast(res.error);
    toast(a.is_published ? "Article enregistré et publié." : "Brouillon enregistré.");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Supprimer définitivement cet article ?")) return;
    const res = await deleteArticle(a.id);
    if (!res.ok) return toast(res.error);
    router.push("/admin/magazine");
  }

  async function addCover(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    const url = await upload(f);
    setBusy(false);
    if (url) set("cover_path", url);
  }

  async function addBodyImage(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    const url = await upload(f);
    setBusy(false);
    if (!url) return;
    const el = body.current;
    const at = el?.selectionStart ?? a.body.length;
    const snippet = `\n\n![Légende de l'image](${url})\n\n`;
    set("body", a.body.slice(0, at) + snippet + a.body.slice(at));
  }

  return (
    <div className="mt-8 max-w-[1100px] space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className="label mb-2 block text-ink-3">Titre</span>
          <input className="admin-input" value={a.title} onChange={(e) => set("title", e.target.value)} />
        </label>
        <label className="block">
          <span className="label mb-2 block text-ink-3">Adresse (/magazine/…)</span>
          <input className="admin-input" value={a.slug} onChange={(e) => set("slug", e.target.value)} />
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <label className="block">
          <span className="label mb-2 block text-ink-3">Rubrique</span>
          <select className="admin-input" value={a.rubric} onChange={(e) => set("rubric", e.target.value)}>
            {[...new Set([...rubrics, a.rubric])].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label mb-2 block text-ink-3">Langue</span>
          <select className="admin-input" value={a.locale} onChange={(e) => set("locale", e.target.value as "fr" | "en")}>
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
          </select>
        </label>
        <label className="block">
          <span className="label mb-2 block text-ink-3">Publié le</span>
          <input type="date" className="admin-input" value={a.published_at} onChange={(e) => set("published_at", e.target.value)} />
        </label>
        <label className="block">
          <span className="label mb-2 block text-ink-3">Mis à jour le (facultatif)</span>
          <input type="date" className="admin-input" value={a.updated_on} onChange={(e) => set("updated_on", e.target.value)} />
        </label>
      </div>

      <label className="block">
        <span className="label mb-2 block text-ink-3">Chapeau (liste du Magazine et partage)</span>
        <textarea className="admin-input" rows={2} value={a.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
      </label>

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <div className="aspect-[4/5] overflow-hidden bg-surface">{a.cover_path && <img src={a.cover_path} alt="" className="h-full w-full object-cover" />}</div>
        <div className="space-y-4">
          <label className="block">
            <span className="label mb-2 block text-ink-3">Image de couverture</span>
            <input type="file" accept="image/*" disabled={busy} onChange={(e) => addCover(e.target.files?.[0])} className="text-[13px]" />
          </label>
          <label className="block">
            <span className="label mb-2 block text-ink-3">Description de l&apos;image (accessibilité)</span>
            <input className="admin-input" value={a.cover_alt} onChange={(e) => set("cover_alt", e.target.value)} />
          </label>
        </div>
      </div>

      <label className="block">
        <span className="label mb-2 block text-ink-3">Encart « Actualité &amp; événements » (facultatif)</span>
        <textarea className="admin-input" rows={2} value={a.news} onChange={(e) => set("news", e.target.value)} />
      </label>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <span className="label text-ink-3">Corps de l&apos;article</span>
          <label className="cursor-pointer text-[13px] text-slate underline-offset-2 hover:underline">
            Insérer une image
            <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => addBodyImage(e.target.files?.[0])} />
          </label>
        </div>
        <textarea ref={body} className="admin-input font-mono text-[14px]" rows={22} value={a.body} onChange={(e) => set("body", e.target.value)} />
        <p className="mt-2 text-[13px] leading-relaxed text-ink-3">
          Un paragraphe par bloc, séparé par une ligne vide. Une ligne qui commence par « &gt; » devient une phrase d&apos;exergue, « ## » un intertitre.
        </p>
      </div>

      <label className="block max-w-[400px]">
        <span className="label mb-2 block text-ink-3">Deck lié (bloc « Le Deck » en fin d&apos;article)</span>
        <select className="admin-input" value={a.deck_id} onChange={(e) => set("deck_id", e.target.value)}>
          <option value="">Aucun</option>
          {decks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-start gap-3 border-y border-rule py-5 text-[14px]">
        <input type="checkbox" className="mt-1 accent-[#558BBB]" checked={a.is_published} onChange={(e) => set("is_published", e.target.checked)} />
        <span>
          <strong className="font-medium">Publié</strong>
          <span className="block text-ink-3">Visible sur /magazine et indexé par les moteurs de recherche.</span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-6">
        <button onClick={save} disabled={busy} className="btn-primary label">
          Enregistrer
        </button>
        <a href={`/magazine/${article.slug}`} target="_blank" rel="noopener" className="btn-link text-[14px]">
          Relire la version enregistrée
        </a>
        <button onClick={remove} className="ml-auto text-[13px] text-rose underline">
          Supprimer
        </button>
      </div>
    </div>
  );
}
