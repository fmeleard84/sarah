import { NextResponse } from "next/server";
import sharp from "sharp";
import { assertAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Image du Magazine (couverture ou image de corps). Convertie en WebP, 1600 px de
 * large au plus, rangée dans le bucket public « magazine ». Renvoie son adresse.
 */
export async function POST(req: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const file = (await req.formData()).get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) return NextResponse.json({ error: "Envoie une image (JPEG, PNG ou WebP)." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image trop lourde (25 Mo maximum)." }, { status: 400 });

  let out: Buffer;
  try {
    out = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  } catch {
    return NextResponse.json({ error: "Image illisible." }, { status: 400 });
  }
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const { error } = await createServiceClient().storage.from("magazine").upload(name, out, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: `/sb/storage/v1/object/public/magazine/${name}` });
}
