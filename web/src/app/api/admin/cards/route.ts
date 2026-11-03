import { NextResponse } from "next/server";
import sharp from "sharp";
import { assertAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;
// Formats des cartes d'origine (web/public/decks) : grande et miniature.
const LARGE = { width: 848, height: 1264 };
const SMALL = { width: 360, height: 537 };

/**
 * Remplace (ou ajoute) l'image d'un arcane dans un deck.
 * Formulaire : deck (id), arcana (0 à 21), file (image).
 *
 * L'image est recadrée au format des cartes, convertie en WebP en deux tailles
 * et rangée dans le bucket public « decks » de Supabase. Le nom contient
 * l'horodatage : aucun cache ne sert l'ancienne version.
 */
export async function POST(req: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const form = await req.formData();
  const deckId = String(form.get("deck") ?? "");
  const arcana = Number(form.get("arcana"));
  const file = form.get("file");
  if (!deckId || !Number.isInteger(arcana) || arcana < 0 || arcana > 21) return NextResponse.json({ error: "Requête incomplète." }, { status: 400 });
  if (!(file instanceof File) || !file.type.startsWith("image/")) return NextResponse.json({ error: "Envoie une image (JPEG, PNG ou WebP)." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image trop lourde (25 Mo maximum)." }, { status: 400 });

  const db = createServiceClient();
  const { data: deck } = await db.from("decks").select("id, slug").eq("id", deckId).maybeSingle();
  if (!deck) return NextResponse.json({ error: "Deck introuvable." }, { status: 404 });

  let large: Buffer, small: Buffer;
  try {
    const src = sharp(Buffer.from(await file.arrayBuffer())).rotate();
    [large, small] = await Promise.all([
      src.clone().resize({ ...LARGE, fit: "cover" }).webp({ quality: 84 }).toBuffer(),
      src.clone().resize({ ...SMALL, fit: "cover" }).webp({ quality: 80 }).toBuffer(),
    ]);
  } catch {
    return NextResponse.json({ error: "Image illisible." }, { status: 400 });
  }

  const base = `${deck.slug}/${String(arcana).padStart(2, "0")}-${Date.now()}`;
  const bucket = db.storage.from("decks");
  const opts = { contentType: "image/webp", cacheControl: "31536000", upsert: true };
  const [a, b] = await Promise.all([bucket.upload(`${base}.webp`, large, opts), bucket.upload(`${base}-sm.webp`, small, opts)]);
  if (a.error || b.error) return NextResponse.json({ error: (a.error ?? b.error)!.message }, { status: 500 });

  // Le chemin suit la convention des cartes d'origine : sans extension, la
  // miniature est « -sm.webp » (voir cardImage dans lib/decks.ts).
  const image_path = `/sb/storage/v1/object/public/decks/${base}`;
  const { error } = await db.from("cards").upsert({ deck_id: deck.id, arcana, image_path }, { onConflict: "deck_id,arcana" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ image_path });
}
