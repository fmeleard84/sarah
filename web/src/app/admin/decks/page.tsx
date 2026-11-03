import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { cardImage } from "@/lib/decks";
import { NewDeck } from "./NewDeck";

export const dynamic = "force-dynamic";

/** Tous les decks, publiés ou non, avec leur état. */
export default async function AdminDecks() {
  const db = createServiceClient();
  const [{ data: decks }, { data: cards }] = await Promise.all([
    db.from("decks").select("*").order("sort"),
    db.from("cards").select("deck_id, arcana, image_path"),
  ]);
  const byDeck = new Map<string, { arcana: number; image_path: string }[]>();
  for (const c of cards ?? []) byDeck.set(c.deck_id, [...(byDeck.get(c.deck_id) ?? []), c]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="display text-[44px]">decks et cartes.</h1>
          <p className="mt-2 text-[14px] text-ink-2">Ouvre un deck pour changer ses cartes et ses textes.</p>
        </div>
        <NewDeck />
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {(decks ?? []).map((d) => {
          const list = byDeck.get(d.id) ?? [];
          const cover = list.find((c) => c.arcana === d.cover_arcana) ?? list[0];
          return (
            <li key={d.id}>
              <Link href={`/admin/decks/${d.slug}`} className="group block">
                <div className={`tarot aspect-[2/3] ${d.is_published ? "" : "opacity-60"}`}>
                  {cover ? (
                    <img src={cardImage(cover.image_path, true)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[12px] text-ink-3">Aucune carte</div>
                  )}
                </div>
                <p className="title mt-3 text-[20px] group-hover:text-slate">{d.name}</p>
                <p className="mt-1 text-[12px] text-ink-3">
                  {list.length}/22 cartes · {d.is_published ? "publié" : "brouillon"}
                  {d.is_open ? " · ouvert" : " · offres payantes"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
