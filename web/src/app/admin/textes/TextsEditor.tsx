"use client";

import { useMemo, useState } from "react";
import { toast } from "@/components/Toast";
import type { Locale } from "@/lib/i18n";
import { saveText } from "../actions";
import { Bilingual } from "../ui";

export interface TextRow {
  key: string;
  section: string;
  defaults: Record<Locale, string>;
  current: Record<Locale, string>;
  modified: Record<Locale, boolean>;
}

export function TextsEditor({ rows }: { rows: TextRow[] }) {
  const [q, setQ] = useState("");
  const [onlyModified, setOnlyModified] = useState(false);

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!onlyModified || r.modified.fr || r.modified.en) &&
        (!s || r.key.toLowerCase().includes(s) || r.current.fr.toLowerCase().includes(s) || r.current.en.toLowerCase().includes(s)),
    );
  }, [rows, q, onlyModified]);

  const sections = useMemo(() => {
    const m = new Map<string, TextRow[]>();
    visible.forEach((r) => m.set(r.section, [...(m.get(r.section) ?? []), r]));
    return [...m.entries()];
  }, [visible]);

  return (
    <>
      <div className="sticky top-[104px] z-20 -mx-[12.5%] mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-rule bg-canvas/95 px-[12.5%] py-4 backdrop-blur">
        <input className="admin-input max-w-sm" placeholder="Chercher un texte ou une clé" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="flex items-center gap-2 text-[13px] text-ink-2">
          <input type="checkbox" className="accent-[#558BBB]" checked={onlyModified} onChange={(e) => setOnlyModified(e.target.checked)} />
          Textes modifiés seulement
        </label>
        <span className="text-[13px] text-ink-3">{visible.length} textes</span>
      </div>

      {sections.map(([name, list]) => (
        <section key={name} className="mt-12">
          <h2 className="title text-[26px]">{name}</h2>
          <div className="mt-2">
            {list.map((r) => (
              <TextItem key={r.key} row={r} />
            ))}
          </div>
        </section>
      ))}
      {sections.length === 0 && <p className="mt-12 text-[14px] text-ink-3">Aucun texte ne correspond.</p>}
    </>
  );
}

function TextItem({ row }: { row: TextRow }) {
  const [v, setV] = useState(row.current);
  const [saved, setSaved] = useState(row.current);
  const [modified, setModified] = useState(row.modified);
  const [busy, setBusy] = useState(false);
  const dirty = v.fr !== saved.fr || v.en !== saved.en;
  const long = Math.max(row.defaults.fr.length, row.defaults.en.length) > 70;

  async function save() {
    setBusy(true);
    for (const l of ["fr", "en"] as Locale[]) {
      if (v[l] === saved[l]) continue;
      // Revenir exactement au texte d'origine supprime la modification.
      const value = v[l].trim() === row.defaults[l] ? null : v[l];
      const res = await saveText(row.key, l, value);
      if (!res.ok) {
        setBusy(false);
        return toast(res.error);
      }
      setModified((m) => ({ ...m, [l]: value !== null }));
    }
    setSaved(v);
    setBusy(false);
    toast("Texte enregistré.");
  }

  async function reset() {
    setBusy(true);
    for (const l of ["fr", "en"] as Locale[]) if (modified[l]) await saveText(row.key, l, null);
    setBusy(false);
    setV(row.defaults);
    setSaved(row.defaults);
    setModified({ fr: false, en: false });
    toast("Texte d'origine rétabli.");
  }

  return (
    <div className="border-t border-rule py-5">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <code className="text-[12px] text-ink-3">{row.key}</code>
        {(modified.fr || modified.en) && <span className="bg-surface px-2 py-0.5 text-[11px] text-rose">modifié</span>}
      </div>
      <Bilingual fr={v.fr} en={v.en} onChange={setV} rows={long ? 3 : 1} context={`texte d'interface (clé ${row.key})`} />
      <div className="mt-3 flex items-center gap-4">
        <button onClick={save} disabled={!dirty || busy} className="admin-btn">
          {busy ? "…" : "Enregistrer"}
        </button>
        {dirty && (
          <button onClick={() => setV(saved)} className="text-[12px] text-ink-3 underline">
            Annuler
          </button>
        )}
        {(modified.fr || modified.en) && !dirty && (
          <button onClick={reset} disabled={busy} className="text-[12px] text-ink-3 underline">
            Rétablir le texte d&apos;origine
          </button>
        )}
      </div>
    </div>
  );
}
