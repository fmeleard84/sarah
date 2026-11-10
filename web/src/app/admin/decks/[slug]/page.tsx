import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { listArcana } from "@/lib/decks";
import { DeckEditor } from "./DeckEditor";
import { CardGrid } from "./CardGrid";

export const dynamic = "force-dynamic";

export default async function AdminDeck({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = createServiceClient();
  const { data: deck } = await db.from("decks").select("*").eq("slug", slug).maybeSingle();
  if (!deck) notFound();
  const [{ data: cards }, arcana] = await Promise.all([db.from("cards").select("arcana, image_path, arch_color, arch_intensity").eq("deck_id", deck.id), listArcana()]);

  return (
    <>
      <Link href="/admin/decks" className="text-[13px] text-ink-3 hover:text-ink">
        Tous les decks
      </Link>
      <h1 className="display mt-3 text-[44px]">{deck.name}</h1>
      <p className="mt-1 text-[13px] text-ink-3">
        n° {deck.number} · /{deck.slug} · {cards?.length ?? 0}/22 cartes
      </p>

      <section className="mt-10">
        <h2 className="title text-[26px]">les cartes.</h2>
        <p className="mt-1 max-w-[70ch] text-[14px] text-ink-2">
          Clique sur une carte pour la remplacer par une nouvelle image. Elle est recadrée au format des cartes (2:3) et apparaît aussitôt dans
          l&apos;application, y compris dans les conversations passées. La pastille sous chaque carte règle la couleur de son arche (home et
          en-tête du chat) : suggérée à l&apos;envoi de l&apos;image, modifiable ici.
        </p>
        <CardGrid deckId={deck.id} cards={cards ?? []} arcana={arcana.map((a) => ({ number: a.number, numeral: a.numeral, name: a.name_fr }))} />
      </section>

      <section className="mt-16 border-t border-rule pt-10">
        <h2 className="title text-[26px]">le deck.</h2>
        <DeckEditor
          deck={{
            id: deck.id,
            name: deck.name,
            artist: deck.artist ?? "",
            description_fr: deck.description_fr,
            description_en: deck.description_en,
            styles: deck.styles,
            moods: deck.moods,
            cover_arcana: deck.cover_arcana,
            is_open: deck.is_open,
            is_published: deck.is_published,
            sort: deck.sort,
          }}
          arcana={arcana.map((a) => ({ number: a.number, label: `${a.numeral} · ${a.name_fr}` }))}
        />
      </section>
    </>
  );
}
