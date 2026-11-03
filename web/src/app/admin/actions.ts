"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin, slugify } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/admin";
import { EDITABLE_KEYS, type Locale } from "@/lib/i18n";
import { cleanText, completeChat } from "@/lib/llm";
import { PLANS, type PlanId } from "@/lib/plans";

type Result = { ok: true } | { ok: false; error: string };

const fail = (error: unknown): Result => ({ ok: false, error: error instanceof Error ? error.message : String(error) });
const refresh = () => revalidatePath("/", "layout");

// ─── Decks ──────────────────────────────────────────────────────────────────

export interface DeckInput {
  id: string;
  name: string;
  artist: string;
  description_fr: string;
  description_en: string;
  styles: string[];
  moods: string[];
  cover_arcana: number;
  is_open: boolean;
  is_published: boolean;
  sort: number;
}

export async function saveDeck(input: DeckInput): Promise<Result> {
  try {
    await assertAdmin();
    const db = createServiceClient();
    if (!input.name.trim()) return { ok: false, error: "Le nom est obligatoire." };

    if (input.is_published) {
      const { count } = await db.from("cards").select("id", { count: "exact", head: true }).eq("deck_id", input.id);
      if ((count ?? 0) < 22) return { ok: false, error: `Il manque des cartes (${count ?? 0} sur 22) : le deck ne peut pas être publié.` };
    }

    const { error } = await db
      .from("decks")
      .update({
        name: input.name.trim(),
        artist: input.artist.trim() || null,
        description_fr: input.description_fr.trim(),
        description_en: input.description_en.trim(),
        styles: input.styles.map((s) => s.trim()).filter(Boolean),
        moods: input.moods.map((s) => s.trim()).filter(Boolean),
        cover_arcana: input.cover_arcana,
        is_open: input.is_open,
        is_published: input.is_published,
        sort: input.sort,
      })
      .eq("id", input.id);
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createDeck(name: string): Promise<Result & { slug?: string }> {
  try {
    await assertAdmin();
    const db = createServiceClient();
    const slug = slugify(name);
    if (!slug) return { ok: false, error: "Donne un nom au deck." };

    const { data: last } = await db.from("decks").select("number, sort").order("number", { ascending: false }).limit(1).maybeSingle();
    const { error } = await db.from("decks").insert({
      slug,
      name: name.trim(),
      number: (last?.number ?? 0) + 1,
      sort: (last?.sort ?? 0) + 1,
      is_published: false,
    });
    if (error) return { ok: false, error: error.code === "23505" ? "Un deck porte déjà ce nom." : error.message };
    refresh();
    return { ok: true, slug };
  } catch (e) {
    return fail(e);
  }
}

// ─── Arcanes ────────────────────────────────────────────────────────────────

export interface ArcanaInput {
  number: number;
  name_fr: string;
  name_en: string;
  keywords_fr: string[];
  keywords_en: string[];
}

export async function saveArcana(input: ArcanaInput): Promise<Result> {
  try {
    await assertAdmin();
    const clean = (l: string[]) => l.map((s) => s.trim()).filter(Boolean);
    const { error } = await createServiceClient()
      .from("arcana")
      .update({
        name_fr: input.name_fr.trim(),
        name_en: input.name_en.trim(),
        keywords_fr: clean(input.keywords_fr),
        keywords_en: clean(input.keywords_en),
      })
      .eq("number", input.number);
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ─── Textes de l'interface ──────────────────────────────────────────────────

/** Enregistre un texte ; une valeur vide (ou null) rétablit le texte d'origine. */
export async function saveText(key: string, locale: Locale, value: string | null): Promise<Result> {
  try {
    const { user } = await assertAdmin();
    if (!EDITABLE_KEYS.has(key)) return { ok: false, error: "Clé inconnue." };
    const db = createServiceClient();
    const text = value?.trim() ?? "";
    const { error } = text
      ? await db.from("ui_texts").upsert({ key, locale, value: text, updated_at: new Date().toISOString(), updated_by: user.id })
      : await db.from("ui_texts").delete().eq("key", key).eq("locale", locale);
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ─── Traduction ─────────────────────────────────────────────────────────────

const LANG: Record<Locale, string> = { fr: "français", en: "anglais" };

/**
 * Traduit un texte de l'application avec le modèle local (Gemma). Les règles
 * de marque sont rappelées : on adapte l'expression, on garde la casse et la
 * ponctuation, jamais de tiret cadratin ni d'emoji.
 */
export async function translate(text: string, from: Locale, to: Locale, context = ""): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    await assertAdmin();
    if (!text.trim()) return { ok: true, text: "" };
    const out = await completeChat(
      [
        {
          role: "system",
          content: [
            `Tu traduis des textes de Morning Cards, une application de tarot « post-mystique » au ton doux, direct et tutoyant, du ${LANG[from]} vers l'${LANG[to]}.`,
            "Adapte l'expression comme le ferait une rédactrice native : pas de traduction mot à mot.",
            "Garde exactement la même casse (si le texte est tout en minuscules, la traduction aussi), la même ponctuation finale et la même longueur approximative.",
            "Ne traduis pas les noms propres de decks et d'offres (Exploration, Intention, Ritual, Clarity).",
            "Jamais de tiret cadratin, jamais d'emoji, pas de guillemets autour de la réponse.",
            "Réponds uniquement par la traduction, sans aucun commentaire.",
          ].join("\n"),
        },
        { role: "user", content: context ? `Contexte : ${context}\n\nTexte :\n${text}` : text },
      ],
      { maxTokens: 800, temperature: 0.2 },
    );
    return { ok: true, text: cleanText(out).replace(/^["«»\s]+|["«»\s]+$/g, "") };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ─── Utilisatrices ──────────────────────────────────────────────────────────

export async function setUserPlan(userId: string, plan: PlanId): Promise<Result> {
  try {
    await assertAdmin();
    if (!(plan in PLANS)) return { ok: false, error: "Offre inconnue." };
    const { error } = await createServiceClient()
      .from("profiles")
      .update({ plan, plan_started_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setExtraCards(userId: string, extra: number): Promise<Result> {
  try {
    await assertAdmin();
    const n = Math.max(0, Math.min(999, Math.floor(extra)));
    const { error } = await createServiceClient().from("profiles").update({ extra_cards: n }).eq("id", userId);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setUserAdmin(userId: string, isAdmin: boolean): Promise<Result> {
  try {
    const { user } = await assertAdmin();
    if (userId === user.id && !isAdmin) return { ok: false, error: "Tu ne peux pas retirer ton propre accès." };
    const { error } = await createServiceClient().from("profiles").update({ is_admin: isAdmin }).eq("id", userId);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
