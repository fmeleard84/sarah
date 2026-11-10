"use client";

import { useEffect, useState } from "react";
import { archMix, ARCH_DEFAULT_INTENSITY } from "@/lib/arch";
import { toast } from "@/components/Toast";
import { getArchPalette, saveArch } from "../../actions";

/**
 * Réglage de l'arche d'une carte (specs de Sarah du 9 novembre) : aperçu de la
 * home avec la carte, couleurs extraites de l'image, pipette et intensité.
 */
export function ArchEditor({
  deckId,
  arcana,
  label,
  image,
  color: initialColor,
  intensity: initialIntensity,
  onClose,
  onSaved,
}: {
  deckId: string;
  arcana: number;
  label: string;
  image: string;
  color: string | null;
  intensity: number;
  onClose: () => void;
  onSaved: (color: string | null, intensity: number) => void;
}) {
  const [color, setColor] = useState<string | null>(initialColor);
  const [k, setK] = useState(initialIntensity ?? ARCH_DEFAULT_INTENSITY);
  const [palette, setPalette] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getArchPalette(deckId, arcana).then((r) => (r.ok ? setPalette(r.colors) : (setPalette([]), toast(r.error))));
  }, [deckId, arcana]);

  async function save() {
    setSaving(true);
    const r = await saveArch(deckId, arcana, color, k);
    setSaving(false);
    if (!r.ok) return toast(r.error);
    toast(`${label} : arche enregistrée.`);
    onSaved(color, k);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div role="dialog" aria-label={`Arche · ${label}`} className="flex max-h-full w-full max-w-[720px] flex-col gap-8 overflow-y-auto bg-canvas p-6 md:flex-row" onClick={(e) => e.stopPropagation()}>
        {/* Aperçu de la home, à l'échelle 1/2. */}
        <div className="relative mx-auto h-[350px] w-[195px] flex-none overflow-hidden border border-rule bg-canvas">
          <div className="absolute left-2 top-0 h-[334px] w-[179px] rounded-b-[73px] transition-colors duration-500" style={{ background: archMix(color, k) }} />
          <p className="relative ml-4 mt-5 font-serif text-[8px] font-medium tracking-[0.06em]">MORNING · CARDS</p>
          <p className="relative ml-4 mt-1 font-serif text-[20px] italic leading-[22px]">bonjour, sarah</p>
          <div className="tarot relative mx-auto mt-5 h-[188px] w-[125px] rounded-[3px]">
            <img src={`${image}-sm.webp`} alt="" className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="title text-[26px]">{label}</p>
          <p className="label mt-6 text-ink-2">Couleurs de la carte</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {palette === null && <span className="text-[13px] text-ink-2">Analyse de l&apos;image…</span>}
            {palette?.length === 0 && <span className="text-[13px] text-ink-2">Aucune couleur franche : choisis-la à la pipette.</span>}
            {palette?.map((c, i) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                title={i === 0 ? `${c} (suggestion)` : c}
                aria-label={c}
                className={`h-9 w-9 rounded-full border ${color?.toUpperCase() === c ? "outline outline-2 outline-offset-2 outline-slate" : ""}`}
                style={{ background: c, borderColor: "var(--color-rule)" }}
              />
            ))}
          </div>

          <label className="mt-6 flex items-center gap-3 text-[14px]">
            <input type="color" value={color ?? "#F9F3F3"} onChange={(e) => setColor(e.target.value.toUpperCase())} className="h-9 w-12 cursor-pointer border border-rule bg-transparent" />
            Pipette <span className="text-ink-2">{color ?? "aucune (arche neutre)"}</span>
          </label>

          <label className="mt-6 block text-[14px]">
            Intensité <span className="tabnum text-ink-2">{k.toFixed(2)}</span>
            <input type="range" min={0.1} max={0.6} step={0.01} value={k} onChange={(e) => setK(Number(e.target.value))} className="mt-2 block w-full accent-slate" />
          </label>
          <p className="mt-1 text-[12px] text-ink-2">De 0,22 à 0,36 en général. 0,30 par défaut.</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={save} disabled={saving} className="admin-btn">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button onClick={() => setColor(null)} className="text-[13px] text-ink-2 underline underline-offset-4">
              Arche neutre
            </button>
            <button onClick={onClose} className="ml-auto text-[13px] text-ink-2">
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
