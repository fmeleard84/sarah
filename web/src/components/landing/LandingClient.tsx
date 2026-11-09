"use client";

import { useEffect, useRef, useState } from "react";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = () => window.matchMedia("(max-width: 640px)").matches;

/**
 * Comportements globaux de la landing : nav opaque après le hero, révélations au
 * scroll ([data-reveal]) et mesure des clics sur les CTA ([data-cta]).
 */
export function LandingEffects() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>(".lp-nav");
    const onScroll = () => nav?.classList.toggle("is-solid", window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-cta]");
      if (!el) return;
      const body = new Blob([JSON.stringify({ cta: el.dataset.cta })], { type: "application/json" });
      navigator.sendBeacon?.("/api/track", body);
    };
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
      io.disconnect();
    };
  }, []);
  return null;
}

interface Moment {
  text: string;
  img: string;
  alt: string;
}

/**
 * Section 03. Desktop : section épinglée, fondu enchaîné entre 4 états piloté par
 * le scroll ; un clic avance d'un état. Mobile : carrousel horizontal (scroll-snap),
 * avance seul toutes les 2 s, un tap avance d'une slide et relance le minuteur.
 */
export function Problem({ moments, transition, now, nextLabel }: { moments: Moment[]; transition: string; now: string; nextLabel: string }) {
  const outer = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [tick, setTick] = useState(0);
  const count = moments.length + 1;

  // Desktop : l'état suit la progression du scroll dans la section.
  useEffect(() => {
    const onScroll = () => {
      if (isMobile() || !outer.current) return;
      const r = outer.current.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(0.999, Math.max(0, -r.top / span)) : 0;
      setActive(Math.floor(p * count));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count]);

  // Mobile : la slide visible donne l'état ; défilement automatique quand la section est à l'écran.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      if (isMobile()) setActive(Math.round(el.scrollLeft / el.clientWidth));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    const timer = window.setInterval(() => {
      if (!visible || !isMobile() || reducedMotion()) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 2000);
    return () => {
      el.removeEventListener("scroll", onScroll);
      io.disconnect();
      window.clearInterval(timer);
    };
  }, [count, tick]);

  const advance = () => {
    if (isMobile()) {
      const el = track.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: reducedMotion() ? "auto" : "smooth" });
      setTick((t) => t + 1); // relance le minuteur
      return;
    }
    const sec = outer.current;
    if (!sec) return;
    const top = sec.getBoundingClientRect().top + window.scrollY;
    const span = sec.offsetHeight - window.innerHeight;
    const target = active >= count - 1 ? top + sec.offsetHeight : top + ((active + 1) / count + 0.02) * span;
    window.scrollTo({ top: target, behavior: reducedMotion() ? "auto" : "smooth" });
  };

  return (
    <section ref={outer} className="lp-problem" aria-roledescription="carrousel">
      <div className="lp-problem-pin" onClick={advance}>
        <div ref={track} className="lp-carousel">
          {moments.map((m, i) => (
            <div key={m.img} className={`lp-moment${active === i ? " is-active" : ""}`} aria-hidden={active !== i}>
              <div className="lp-moment-text">
                <h3 className="lp-display">{m.text}</h3>
              </div>
              <div className="lp-moment-img">
                <img src={m.img} alt={m.alt} loading="lazy" decoding="async" />
              </div>
            </div>
          ))}
          <div className={`lp-moment lp-moment-final${active === count - 1 ? " is-active" : ""}`} aria-hidden={active !== count - 1}>
            <div>
              <p className="lp-serif-it">{transition}</p>
              <p className="lp-caps">{now}</p>
            </div>
          </div>
        </div>
        <div className={`lp-dots${active === count - 1 ? " final" : ""}`} aria-hidden="true">
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className={i === active ? "on" : ""} />
          ))}
        </div>
        <button
          type="button"
          className="sr-only"
          onClick={(e) => {
            e.stopPropagation();
            advance();
          }}
        >
          {nextLabel}
        </button>
      </div>
    </section>
  );
}

/** Section 11 : accordéon, plusieurs réponses peuvent rester ouvertes. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <div className="lp-faq-list">
      {items.map((it, i) => (
        <div key={it.q} className="lp-faq-item">
          <button type="button" aria-expanded={open.has(i)} aria-controls={`faq-${i}`} onClick={() => toggle(i)}>
            <span>{it.q}</span>
            <i aria-hidden="true">+</i>
          </button>
          <div id={`faq-${i}`} className={`lp-faq-a${open.has(i) ? " open" : ""}`} role="region">
            <div>
              <p>{it.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
