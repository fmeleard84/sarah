import { createServiceClient } from "@/lib/supabase/admin";
import { ArcanaRow } from "./ArcanaRow";

export const dynamic = "force-dynamic";

export default async function AdminArcana() {
  const db = createServiceClient();
  const [{ data: arcana }, { data: covers }] = await Promise.all([
    db.from("arcana").select("*").order("number"),
    db.from("cards").select("arcana, image_path, decks!inner(sort, is_published)").eq("decks.is_published", true),
  ]);
  // Une vignette par arcane : celle du premier deck publié.
  const thumb = new Map<number, string>();
  ((covers ?? []) as unknown as { arcana: number; image_path: string; decks: { sort: number } }[])
    .sort((a, b) => a.decks.sort - b.decks.sort)
    .forEach((c) => thumb.has(c.arcana) || thumb.set(c.arcana, `${c.image_path}-sm.webp`));

  return (
    <>
      <h1 className="display text-[44px]">arcanes.</h1>
      <p className="mt-2 max-w-[70ch] text-[14px] text-ink-2">
        Noms des 22 arcanes majeurs, communs à tous les decks. Ils s&apos;affichent sous les cartes et sont transmis à l&apos;IA. Tradition de
        Marseille : The Juggler, Fortitude, The House of God…
      </p>
      <div className="mt-8">
        {(arcana ?? []).map((a) => (
          <ArcanaRow key={a.number} arcana={a} thumb={thumb.get(a.number) ?? null} />
        ))}
      </div>
    </>
  );
}
