"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/Toast";
import { saveDeck, type DeckInput } from "../../actions";
import { Bilingual, fromList, toList } from "../../ui";

/** Textes et réglages d'un deck. */
export function DeckEditor({ deck, arcana }: { deck: DeckInput; arcana: { number: number; label: string }[] }) {
  const router = useRouter();
  const [d, setD] = useState(deck);
  const [styles, setStyles] = useState(fromList(deck.styles));
  const [moods, setMoods] = useState(fromList(deck.moods));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await saveDeck({ ...d, styles: toList(styles), moods: toList(moods) });
    setBusy(false);
    if (!res.ok) return toast(res.error);
    toast("Deck enregistré.");
    router.refresh();
  }

  return (
    <div className="mt-6 max-w-[1100px] space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className="label mb-2 block text-ink-3">Nom</span>
          <input className="admin-input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
        </label>
        <label className="block">
          <span className="label mb-2 block text-ink-3">Artiste ou inspiration</span>
          <input className="admin-input" value={d.artist} onChange={(e) => setD({ ...d, artist: e.target.value })} />
        </label>
      </div>

      <Bilingual
        label="Description (affichée dans l'app et transmise à l'IA)"
        rows={5}
        fr={d.description_fr}
        en={d.description_en}
        onChange={(v) => setD({ ...d, description_fr: v.fr, description_en: v.en })}
        context="description d'un deck de tarot artistique"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className="label mb-2 block text-ink-3">Styles (séparés par des virgules)</span>
          <input className="admin-input" value={styles} onChange={(e) => setStyles(e.target.value)} />
        </label>
        <label className="block">
          <span className="label mb-2 block text-ink-3">Ambiances (séparées par des virgules)</span>
          <input className="admin-input" value={moods} onChange={(e) => setMoods(e.target.value)} />
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <label className="block">
          <span className="label mb-2 block text-ink-3">Carte de couverture</span>
          <select className="admin-input" value={d.cover_arcana} onChange={(e) => setD({ ...d, cover_arcana: Number(e.target.value) })}>
            {arcana.map((a) => (
              <option key={a.number} value={a.number}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label mb-2 block text-ink-3">Ordre d&apos;affichage</span>
          <input type="number" className="admin-input" value={d.sort} onChange={(e) => setD({ ...d, sort: Number(e.target.value) })} />
        </label>
      </div>

      <div className="space-y-3 border-y border-rule py-5">
        <label className="flex items-start gap-3 text-[14px]">
          <input type="checkbox" className="mt-1 accent-[#558BBB]" checked={d.is_published} onChange={(e) => setD({ ...d, is_published: e.target.checked })} />
          <span>
            <strong className="font-medium">Publié</strong>
            <span className="block text-ink-3">Visible dans l&apos;application. Il faut les 22 cartes.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-[14px]">
          <input type="checkbox" className="mt-1 accent-[#558BBB]" checked={d.is_open} onChange={(e) => setD({ ...d, is_open: e.target.checked })} />
          <span>
            <strong className="font-medium">Ouvert à tous</strong>
            <span className="block text-ink-3">Proposé à l&apos;onboarding et sur les offres gratuites. Sinon, réservé à Ritual et Clarity.</span>
          </span>
        </label>
      </div>

      <button onClick={save} disabled={busy} className="btn-primary label">
        {busy ? "Enregistrement…" : "Enregistrer le deck"}
      </button>
    </div>
  );
}
