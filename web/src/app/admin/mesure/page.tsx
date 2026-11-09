import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { EARLY_ADOPTER_SPOTS } from "@/lib/plans";

export const dynamic = "force-dynamic";

const PERIODS = [
  { key: "7", label: "7 jours", days: 7 },
  { key: "30", label: "30 jours", days: 30 },
  { key: "90", label: "90 jours", days: 90 },
] as const;

interface Row {
  visitors: number;
  drawers: number;
  signups: number;
}

/** Début de la période, calculé à chaque requête (page dynamique). */
const daysAgo = (days: number) => new Date(Date.now() - days * 86400_000).toISOString();

const CTA_PLACES: Record<string, string> = {
  hero: "Haut de page",
  nav: "Menu (Rejoindre)",
  bandeau: "Bandeau des 100 premières",
  art: "L'art du tirage",
  rejoindre: "Les cent premières",
};

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 1000) / 10} %` : "–");

/**
 * Mesure du test marché (décembre à février), méthode du mail à Sarah :
 * A = visiteurs, B = visiteurs qui tirent une carte, C = visiteurs qui créent un compte.
 * B sous 10 % de A : produit mal compris. Bon A et bon B mais mauvais C : pertinence non prouvée.
 */
export default async function Mesure({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const period = PERIODS.find((x) => x.key === p) ?? PERIODS[1];
  const since = daysAgo(period.days);

  const db = createServiceClient();
  const [bySource, daily, early, ctas] = await Promise.all([
    db.rpc("funnel_by_source", { since }),
    db.rpc("funnel_daily", { since }),
    db.from("early_adopters").select("user_id", { count: "exact", head: true }),
    db.rpc("landing_ctas", { since }),
  ]);
  const ctaRows = (ctas.data ?? []) as { place: string; clicks: number; visitors: number }[];
  const sources = (bySource.data ?? []) as (Row & { source: string })[];
  const days = (daily.data ?? []) as (Row & { day: string })[];
  const total = sources.reduce((t, s) => ({ visitors: t.visitors + Number(s.visitors), drawers: t.drawers + Number(s.drawers), signups: t.signups + Number(s.signups) }), {
    visitors: 0,
    drawers: 0,
    signups: 0,
  });

  const stats = [
    { label: "A · visiteurs", value: total.visitors, note: "navigateurs venus sur le site" },
    { label: "B · ont tiré une carte", value: total.drawers, note: `${pct(total.drawers, total.visitors)} de A` },
    { label: "C · ont créé un compte", value: total.signups, note: `${pct(total.signups, total.visitors)} de A · ${pct(total.signups, total.drawers)} de B` },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="display text-[44px] md:text-[56px]">mesure.</h1>
        <nav className="flex gap-6">
          {PERIODS.map((x) => (
            <Link key={x.key} href={`/admin/mesure?p=${x.key}`} className={`label border-b pb-1 ${x.key === period.key ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink"}`}>
              {x.label}
            </Link>
          ))}
        </nav>
      </div>
      {(bySource.error || daily.error) && <p className="mt-6 text-[14px] text-rose">Lecture impossible : {(bySource.error ?? daily.error)?.message}</p>}

      <dl className="mt-10 grid gap-px border border-rule bg-rule md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-canvas p-5">
            <dt className="label text-ink-3">{s.label}</dt>
            <dd className="title mt-3 text-[40px] tabular-nums">{s.value}</dd>
            <dd className="mt-1 text-[13px] text-ink-2">{s.note}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 text-[14px] text-ink-2">
        Offre des cent premières : {early.count ?? 0} place{(early.count ?? 0) > 1 ? "s" : ""} prise{(early.count ?? 0) > 1 ? "s" : ""} sur {EARLY_ADOPTER_SPOTS}.
      </p>

      <section className="mt-14">
        <h2 className="title text-[28px]">par source.</h2>
        <p className="mt-2 max-w-[60ch] text-[14px] leading-relaxed text-ink-2">
          La source est le paramètre <code>utm_source</code> du lien, sinon le site d&apos;où vient la personne, sinon « direct ». Pour les réseaux, ajouter par exemple{" "}
          <code>?utm_source=instagram&amp;utm_campaign=lancement</code> aux liens publiés.
        </p>
        <Table rows={sources.map((s) => ({ key: s.source, ...s }))} first="Source" />
      </section>

      <section className="mt-14">
        <h2 className="title text-[28px]">boutons de la landing.</h2>
        <p className="mt-2 max-w-[60ch] text-[14px] leading-relaxed text-ink-2">Clics sur les appels à l&apos;action « early adopter », par emplacement.</p>
        {ctaRows.length === 0 ? (
          <p className="mt-6 text-[14px] text-ink-3">Rien sur la période.</p>
        ) : (
          <table className="mt-6 w-full max-w-[560px] text-left text-[14px] tabular-nums">
            <thead>
              <tr className="label border-b border-rule text-ink-3">
                <th className="py-3 pr-4 font-normal">Emplacement</th>
                <th className="py-3 pr-4 text-right font-normal">Clics</th>
                <th className="py-3 text-right font-normal">Visiteurs</th>
              </tr>
            </thead>
            <tbody>
              {ctaRows.map((r) => (
                <tr key={r.place} className="border-b border-rule">
                  <td className="py-3 pr-4">{CTA_PLACES[r.place] ?? r.place}</td>
                  <td className="py-3 pr-4 text-right">{r.clicks}</td>
                  <td className="py-3 text-right">{r.visitors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-14">
        <h2 className="title text-[28px]">jour par jour.</h2>
        <Table rows={days.map((d) => ({ key: new Date(`${d.day}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }), ...d }))} first="Jour" />
      </section>

      <p className="mt-14 max-w-[70ch] text-[13px] leading-relaxed text-ink-3">
        Un visiteur est un navigateur, pas une personne : la même personne sur son téléphone puis son ordinateur compte deux fois. Une visite n&apos;est comptée que si JavaScript
        tourne, ce qui écarte la plupart des robots. Ce navigateur n&apos;est plus compté depuis que tu as ouvert l&apos;administration, et les scripts de recette ne le sont pas
        non plus.
      </p>
    </>
  );
}

function Table({ rows, first }: { rows: (Row & { key: string })[]; first: string }) {
  if (!rows.length) return <p className="mt-6 text-[14px] text-ink-3">Rien sur la période.</p>;
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-[14px] tabular-nums">
        <thead>
          <tr className="label border-b border-rule text-ink-3">
            <th className="py-3 pr-4 font-normal">{first}</th>
            <th className="py-3 pr-4 text-right font-normal">A</th>
            <th className="py-3 pr-4 text-right font-normal">B</th>
            <th className="py-3 pr-4 text-right font-normal">B / A</th>
            <th className="py-3 pr-4 text-right font-normal">C</th>
            <th className="py-3 text-right font-normal">C / A</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-rule">
              <td className="py-3 pr-4">{r.key}</td>
              <td className="py-3 pr-4 text-right">{r.visitors}</td>
              <td className="py-3 pr-4 text-right">{r.drawers}</td>
              <td className="py-3 pr-4 text-right text-ink-2">{pct(Number(r.drawers), Number(r.visitors))}</td>
              <td className="py-3 pr-4 text-right">{r.signups}</td>
              <td className="py-3 text-right text-ink-2">{pct(Number(r.signups), Number(r.visitors))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
