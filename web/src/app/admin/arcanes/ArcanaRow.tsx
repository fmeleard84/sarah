"use client";

import { useState } from "react";
import { toast } from "@/components/Toast";
import { saveArcana } from "../actions";
import { Bilingual } from "../ui";

interface Row {
  number: number;
  numeral: string;
  name_fr: string;
  name_en: string;
  keywords_fr: string[];
  keywords_en: string[];
}

export function ArcanaRow({ arcana, thumb }: { arcana: Row; thumb: string | null }) {
  const [name, setName] = useState({ fr: arcana.name_fr, en: arcana.name_en });
  const [saved, setSaved] = useState(name);
  const [busy, setBusy] = useState(false);
  const dirty = name.fr !== saved.fr || name.en !== saved.en;

  async function save() {
    setBusy(true);
    const res = await saveArcana({ number: arcana.number, name_fr: name.fr, name_en: name.en, keywords_fr: arcana.keywords_fr, keywords_en: arcana.keywords_en });
    setBusy(false);
    if (!res.ok) return toast(res.error);
    setSaved(name);
    toast(`${arcana.numeral} · ${name.fr} enregistré.`);
  }

  return (
    <div className="grid gap-6 border-t border-rule py-6 md:grid-cols-[56px_1fr]">
      <div className="flex items-start gap-4 md:block">
        <div className="tarot aspect-[2/3] w-[56px] shrink-0">{thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}</div>
        <p className="title text-[22px] md:mt-2">{arcana.numeral}</p>
      </div>
      <div className="space-y-5">
        <Bilingual label="Nom" fr={name.fr} en={name.en} onChange={setName} context="nom d'un arcane majeur du Tarot de Marseille (tradition de Marseille, pas Rider-Waite)" />
        <button onClick={save} disabled={!dirty || busy} className="admin-btn">
          {busy ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré"}
        </button>
      </div>
    </div>
  );
}
