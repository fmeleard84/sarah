"use client";

import { useState } from "react";
import { toast } from "@/components/Toast";
import { translate } from "./actions";

/**
 * Champ bilingue : français et anglais côte à côte, avec traduction
 * automatique dans un sens ou dans l'autre (modèle local, à relire).
 */
export function Bilingual({
  label,
  fr,
  en,
  onChange,
  rows = 1,
  context,
}: {
  label?: string;
  fr: string;
  en: string;
  onChange: (v: { fr: string; en: string }) => void;
  rows?: number;
  context?: string;
}) {
  const [busy, setBusy] = useState<null | "fr" | "en">(null);

  async function run(to: "fr" | "en") {
    const from = to === "en" ? "fr" : "en";
    const src = from === "fr" ? fr : en;
    if (!src.trim()) return toast(from === "fr" ? "Le texte français est vide." : "Le texte anglais est vide.");
    setBusy(to);
    const res = await translate(src, from, to, context);
    setBusy(null);
    if (!res.ok) return toast(`Traduction impossible : ${res.error}`);
    onChange(to === "en" ? { fr, en: res.text } : { fr: res.text, en });
  }

  const Field = rows > 1 ? "textarea" : "input";
  return (
    <div>
      {label && <p className="label mb-2 text-ink-3">{label}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {(["fr", "en"] as const).map((l) => (
          <div key={l}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">{l}</span>
              <button
                type="button"
                onClick={() => run(l)}
                disabled={busy !== null}
                className="text-[12px] text-slate underline-offset-2 hover:underline disabled:opacity-40"
              >
                {busy === l ? "Traduction…" : l === "en" ? "Traduire depuis le français" : "Traduire depuis l'anglais"}
              </button>
            </div>
            <Field
              className="admin-input"
              rows={rows > 1 ? rows : undefined}
              value={l === "fr" ? fr : en}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                onChange(l === "fr" ? { fr: e.target.value, en } : { fr, en: e.target.value })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Une liste de mots séparés par des virgules. */
export const toList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
export const fromList = (l: string[]) => l.join(", ");
