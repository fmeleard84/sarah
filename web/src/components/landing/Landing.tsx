import Link from "next/link";
import { getDict } from "@/lib/texts";
import { cardImage, listDecks } from "@/lib/decks";
import { createServiceClient } from "@/lib/supabase/admin";
import { EARLY_ADOPTER_SPOTS } from "@/lib/plans";
import { hasPublishedArticles } from "@/lib/magazine";
import type { Locale } from "@/lib/i18n";
import { Faq, LandingEffects, Problem } from "./LandingClient";
import { siteFonts } from "./fonts";
import "./landing.css";

/** Lien Instagram, à poser dans .env.local quand le compte est prêt. */
const INSTAGRAM_URL = process.env.INSTAGRAM_URL || null;

/** Carte de démonstration (Les Amoureux) et fond flou de « L'art du tirage ». */
const DEMO_DECK = "Cut";
const DEMO_CARD = "/decks/cut/06";
const ART_BG = "/decks/egon/06";

interface GalleryCard {
  image_path: string;
}

/** Colonnes de la galerie finale : ordre aléatoire à chaque affichage. */
function galleryColumns(cards: GalleryCard[], columns: number, perColumn: number) {
  const pool = [...cards];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return Array.from({ length: columns }, (_, c) => ({
    duration: 55 + ((c * 17) % 30),
    cards: Array.from({ length: perColumn }, (_, k) => pool[(c * perColumn + k) % Math.max(pool.length, 1)]).filter(Boolean),
  }));
}

export async function Landing({ locale }: { locale: Locale }) {
  const db = createServiceClient();
  const [t, decks, cardsRes, early, magazine] = await Promise.all([
    getDict(locale),
    listDecks(),
    db.from("cards").select("image_path, arcana, deck_id, decks!inner(is_published)").eq("decks.is_published", true),
    db.from("early_adopters").select("user_id", { count: "exact", head: true }),
    hasPublishedArticles(locale),
  ]);
  const l = t.landing;
  const cards = (cardsRes.data ?? []) as (GalleryCard & { arcana: number; deck_id: string })[];
  const cover = (deckId: string, arcana: number) => cards.find((c) => c.deck_id === deckId && c.arcana === arcana)?.image_path;
  const spots = Math.max(0, EARLY_ADOPTER_SPOTS - (early.count ?? 0));
  const columns = galleryColumns(cards, 12, 8);
  const exclusive = cards.find((c) => c.image_path.includes("/egon/21"))?.image_path ?? DEMO_CARD;
  const [line1, line2, line3, line4] = l.heroTitleLines;

  return (
    <div className={`lp ${siteFonts}`}>
      <LandingEffects />

      {/* 00 · Nav */}
      <header className="lp-nav">
        <a href="#top" className="lp-wordmark" aria-label={l.wordmark}>
          {l.wordmark}
        </a>
        <nav className="lp-nav-links">
          <a href="#rejoindre" data-cta="nav">
            <span className="long">{l.navJoin}</span>
            <span className="short">{l.navJoinShort}</span>
          </a>
          <span className="sep" aria-hidden="true">
            ·
          </span>
          <Link href="/connexion" className="login">
            {l.navLogin}
          </Link>
        </nav>
      </header>

      <main id="top">
        <div className="lp-stack">
          {/* 01 · Hero */}
          <section className="lp-hero">
            <picture>
              <source media="(max-width: 640px)" srcSet="/lp/hero-portrait.webp" />
              <img src="/lp/hero.webp" alt="" fetchPriority="high" />
            </picture>
            <div className="lp-hero-body">
              <h1 className="lp-display" aria-label={l.heroTitle}>
                <span className="desk" aria-hidden="true">
                  {line1} {line2}
                  <br />
                  {line3} {line4}
                </span>
                <span className="mob" aria-hidden="true">
                  {line1}
                  <br />
                  {line2}
                  <br />
                  {line3}
                  <br />
                  {line4}
                </span>
              </h1>
              <p className="lp-hero-sub">{l.heroSub}</p>
              <div className="lp-hero-row">
                <Link href="/bienvenue" className="lp-cta" data-cta="hero">
                  {l.cta}
                </Link>
                <span className="lp-micro">{l.heroMicro}</span>
              </div>
            </div>
          </section>

          {/* 02 · Rupture */}
          <section className="lp-rupture">
            <img src="/lp/rupture.webp" alt="" loading="lazy" decoding="async" />
            <div className="lp-rupture-body" data-reveal>
              <h2 className="lp-serif-it">{l.ruptureTitle}</h2>
              <p>{l.ruptureSub}</p>
            </div>
          </section>
        </div>

        {/* 03 · Le problème */}
        <Problem
          moments={[
            { text: l.moments[0], img: "/lp/couple.webp", alt: l.momentsAlt[0] },
            { text: l.moments[1], img: "/lp/solitude.webp", alt: l.momentsAlt[1] },
            { text: l.moments[2], img: "/lp/soiree.webp", alt: l.momentsAlt[2] },
          ]}
          transition={l.transition}
          now={l.now}
          nextLabel={l.momentsNext}
        />

        {/* 04 · Early adopter, premier passage */}
        <section className="lp-band">
          <p>{l.earlyBand}</p>
          <div className="lp-band-cta">
            <Link href="/bienvenue" className="lp-cta" data-cta="bandeau">
              {l.cta}
            </Link>
            <span className="lp-micro">{l.earlyBandMicro}</span>
          </div>
        </section>

        {/* 05 · Comment ça marche */}
        <section className="lp-how">
          <h2 className="lp-display lp-h2" data-reveal>
            {l.howTitle}
          </h2>
          <ol className="lp-steps">
            {l.steps.map((s, i) => (
              <li key={s.title} className="lp-step" data-reveal>
                <span className="lp-step-num" aria-hidden="true">
                  0{i + 1}
                </span>
                <h3 className="lp-caps">{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="lp-phones" aria-hidden="true">
            <div className="lp-phone">
              <div className="lp-phone-screen">
                <div className="lp-tarot">
                  <img src="/brand/card-back.webp" alt="" loading="lazy" />
                </div>
              </div>
            </div>
            <div className="lp-phone">
              <div className="lp-phone-screen">
                <div className="lp-tarot">
                  <img src={cardImage(DEMO_CARD, true)} alt="" loading="lazy" />
                </div>
                <p className="lp-demo-drawn lp-serif-it">
                  {l.demoDrawn} · <b>{l.demoCard}</b>
                </p>
                <p>
                  {l.demoMeta} {DEMO_DECK}
                </p>
                <span className="lp-demo-btn">{l.demoReveal}</span>
              </div>
            </div>
            <div className="lp-phone">
              <div className="lp-phone-screen lp-phone-chat">
                <div className="lp-chat-head">
                  <div className="lp-tarot">
                    <img src={cardImage(DEMO_CARD, true)} alt="" loading="lazy" />
                  </div>
                  <div>
                    <strong>{l.demoCard.toLowerCase()}</strong>
                    <span>
                      {l.demoTime} {DEMO_DECK.toLowerCase()}
                    </span>
                  </div>
                </div>
                <span className="lp-chat-label">{l.demoLabel}</span>
                <p className="lp-chat-quote">{l.demoQuote}</p>
                <p className="lp-chat-reply">{l.demoReply}</p>
                <span className="lp-chat-ask">{l.demoAsk}</span>
              </div>
            </div>
          </div>
        </section>
        <p className="lp-clarity lp-serif-it" data-reveal>
          {l.clarity}
        </p>

        {/* 06 · Les decks */}
        <section className="lp-decks">
          <div className="lp-decks-head">
            <h2 className="lp-display lp-h2" data-reveal>
              {l.decksTitle}
            </h2>
            <p data-reveal>{l.decksSub}</p>
          </div>
          <div className="lp-marquee">
            {[0, 1].map((copy) => (
              <div key={copy} style={{ display: "flex" }} aria-hidden={copy === 1}>
                {decks.map((d) => {
                  const img = cover(d.id, d.cover_arcana);
                  return (
                    <article key={d.id} className="lp-deck">
                      <div className="lp-tarot">{img && <img src={cardImage(img, true)} alt={copy ? "" : d.name} loading="lazy" decoding="async" />}</div>
                      <h3>{d.name}</h3>
                      <p>{[...d.styles, ...d.moods].slice(0, 3).join(" · ")}</p>
                    </article>
                  );
                })}
                <article className="lp-deck lp-deck-exclusive">
                  <div className="lp-tarot">
                    <img src={cardImage(exclusive, true)} alt="" loading="lazy" decoding="async" />
                    <span>{l.decksExclusive}</span>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </section>

        {/* 07 · Elles l'utilisent */}
        <section className="lp-proof">
          <h2 className="lp-display lp-h2" data-reveal>
            {l.proofTitle}
          </h2>
          <p data-reveal>{l.proofSub}</p>
          <div className="lp-quotes">
            {l.quotes.map((q) => (
              <figure key={q.who} className="lp-quote" data-reveal>
                <blockquote className="lp-serif-it">{q.text}</blockquote>
                <figcaption>{q.who}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* 08 · L'art du tirage */}
        <section className="lp-art">
          <div className="lp-art-text">
            <h2 className="lp-display lp-h2" data-reveal>
              {l.artTitle}
            </h2>
            <p data-reveal>{l.artBody}</p>
            <a href="#rejoindre" className="lp-underline" data-cta="art">
              {l.artCta}
            </a>
          </div>
          <div className="lp-art-visual" aria-hidden="true">
            <img className="lp-art-bg" src={cardImage(ART_BG, true)} alt="" loading="lazy" />
            <div className="lp-phone">
              <img src={cardImage(DEMO_CARD)} alt="" loading="lazy" decoding="async" />
            </div>
          </div>
        </section>

        {/* 09 · Le rituel */}
        <section className="lp-ritual">
          <div className="lp-ritual-img">
            <picture>
              <source media="(max-width: 900px)" srcSet="/lp/rituel-sm.webp" />
              <img src="/lp/rituel.webp" alt={l.ritualAlt} loading="lazy" decoding="async" />
            </picture>
          </div>
          <div className="lp-ritual-text">
            <p className="lp-caps">{l.ritualLabel}</p>
            <h2 className="lp-serif-it" data-reveal>
              {l.ritualTitle}
            </h2>
            <p data-reveal>{l.ritualBody}</p>
            <p className="rhythm">{l.ritualRhythm}</p>
          </div>
        </section>

        {/* 10 · Rejoindre */}
        <section className="lp-join" id="rejoindre">
          <h2 className="lp-display" data-reveal>
            {l.joinTitle}
          </h2>
          <p className="lp-join-sub">{l.joinSub}</p>
          <ul>
            {l.joinBenefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <div className="lp-join-action">
            <p className="lp-spots">{l.spotsLeft(spots)}</p>
            <Link href="/bienvenue" className="lp-cta" data-cta="rejoindre">
              {l.cta}
            </Link>
            <small>{l.joinMicro}</small>
          </div>
        </section>

        {/* 11 · FAQ */}
        <section className="lp-faq">
          <h2 className="lp-display">{l.faqTitle}</h2>
          <Faq items={l.faq} />
        </section>

        {/* 12 · En voir plus (affiché dès qu'il y a un lien à proposer) */}
        {(magazine || INSTAGRAM_URL) && (
          <section className="lp-more">
            <p className="lp-serif-it">{l.moreTitle}</p>
            <nav>
              {magazine && (
                <Link href="/magazine" className="lp-caps lp-underline">
                  {l.magazine}
                </Link>
              )}
              {INSTAGRAM_URL && (
                <a href={INSTAGRAM_URL} className="lp-caps lp-underline" target="_blank" rel="noopener">
                  {l.instagram}
                </a>
              )}
            </nav>
          </section>
        )}

        {/* 13 · Galerie finale */}
        <section className="lp-gallery" aria-hidden="true">
          <div className="lp-gallery-cols">
            {columns.map((col, i) => (
              <div key={i} className="lp-gallery-col">
                <div className="lp-gallery-track" style={{ "--d": `${col.duration}s` } as React.CSSProperties}>
                  {[...col.cards, ...col.cards].map((c, k) => (
                    <div key={k} className="lp-tarot">
                      <img src={cardImage(c.image_path, true)} alt="" loading="lazy" decoding="async" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="lp-gallery-mark">Morning · Cards</p>
        </section>
        <a href="#top" className="sr-only">
          {l.backToTop}
        </a>
      </main>

      {/* 14 · Footer */}
      <footer className="lp-footer">
        <div className="left">
          <img src="/brand/picto.svg" alt="Morning Cards" width={26} height={34} style={{ filter: "invert(1)" }} />
        </div>
        <div className="right">
          {magazine && (
            <Link href="/magazine" className="mag">
              {l.magazine}
            </Link>
          )}
          {INSTAGRAM_URL && (
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener">
              {l.instagram}
            </a>
          )}
          <a href="#top">{l.backToTop}</a>
        </div>
      </footer>
    </div>
  );
}
