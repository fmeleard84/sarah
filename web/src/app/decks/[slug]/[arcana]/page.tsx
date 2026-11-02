import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/session";
import { arcanaAcrossDecks, cardImage, deckCards, getDeck, listArcana } from "@/lib/decks";
import { DICTS } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";

/**
 * Fiche carte : pleine largeur, ratio 2:3. Deux défilements horizontaux :
 * les autres cartes du deck, et le même arcane dans les autres decks.
 */
export default async function CardDetail({ params }: { params: Promise<{ slug: string; arcana: string }> }) {
  const { slug, arcana: raw } = await params;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 21) notFound();
  const { profile } = await requireAccount();
  const deck = await getDeck(slug);
  if (!deck) notFound();
  const locale = profile.locale;
  const t = DICTS[locale];
  const [cards, arcana, across] = await Promise.all([deckCards(deck.id), listArcana(), arcanaAcrossDecks(n)]);
  const card = cards.find((c) => c.arcana === n)!;
  const a = arcana[n];
  const nameOf = (k: number) => (locale === "en" ? arcana[k].name_en : arcana[k].name_fr);

  return (
    <AppShell locale={locale} firstName={profile.first_name}>
      <Link href={`/decks/${slug}`} className="-ml-1 inline-flex h-10 items-center text-[26px] text-ink/70" aria-label="Retour">
        ‹
      </Link>
      <div className="tarot mx-auto mt-2 aspect-[2/3] w-full max-w-[420px]">
        <img src={cardImage(card.image_path)} alt={nameOf(n)} className="h-full w-full object-cover" />
      </div>
      <h1 className="title mt-6 text-[32px]">
        <span className="text-ink-3">{a.numeral} · </span>
        {nameOf(n).toLowerCase()}.
      </h1>
      <p className="mt-1 text-[13px] text-ink-3">{deck.name}</p>

      <section className="mt-12">
        <h2 className="title text-[20px]">{t.decks.otherCards}</h2>
        <div className="no-scrollbar -mx-[12.5%] mt-4 flex gap-3 overflow-x-auto px-[12.5%] pb-2">
          {cards
            .filter((c) => c.arcana !== n)
            .map((c) => (
              <Link key={c.id} href={`/decks/${slug}/${c.arcana}`} className="w-24 shrink-0">
                <div className="tarot aspect-[2/3]">
                  <img src={cardImage(c.image_path, true)} alt={nameOf(c.arcana)} className="h-full w-full object-cover" loading="lazy" />
                </div>
              </Link>
            ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="title text-[20px]">{t.decks.otherDecks}</h2>
        <div className="no-scrollbar -mx-[12.5%] mt-4 flex gap-3 overflow-x-auto px-[12.5%] pb-2">
          {across
            .filter((c) => c.decks.slug !== slug)
            .map((c) => (
              <Link key={c.id} href={`/decks/${c.decks.slug}/${n}`} className="w-24 shrink-0">
                <div className="tarot aspect-[2/3]">
                  <img src={cardImage(c.image_path, true)} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <p className="mt-1.5 text-[12px] text-ink-3">{c.decks.name}</p>
              </Link>
            ))}
        </div>
      </section>
    </AppShell>
  );
}
