"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "@/components/Toast";

const img = (path: string) => `${path}-sm.webp`;

/** Les 22 arcanes du deck ; un clic sur une case envoie une nouvelle image. */
export function CardGrid({
  deckId,
  cards,
  arcana,
}: {
  deckId: string;
  cards: { arcana: number; image_path: string }[];
  arcana: { number: number; numeral: string; name: string }[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [local, setLocal] = useState<Record<number, string>>({});
  const byArcana = new Map(cards.map((c) => [c.arcana, c.image_path]));

  function pick(n: number) {
    if (busy !== null) return;
    setTarget(n);
    input.current?.click();
  }

  async function upload(file: File) {
    if (target === null) return;
    const n = target;
    setBusy(n);
    const body = new FormData();
    body.set("deck", deckId);
    body.set("arcana", String(n));
    body.set("file", file);
    try {
      const res = await fetch("/api/admin/cards", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`);
      setLocal((l) => ({ ...l, [n]: json.image_path }));
      toast(`${arcana[n].numeral} · ${arcana[n].name} : carte remplacée.`);
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
        {arcana.map((a) => {
          const path = local[a.number] ?? byArcana.get(a.number);
          return (
            <li key={a.number}>
              <button type="button" onClick={() => pick(a.number)} className="group block w-full text-left" disabled={busy !== null}>
                <div className="tarot relative aspect-[2/3]">
                  {path ? (
                    <img src={img(path)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center p-2 text-center text-[11px] text-ink-3">Ajouter une image</div>
                  )}
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-ink/55 text-[11px] uppercase tracking-[0.14em] text-canvas transition-opacity ${
                      busy === a.number ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {busy === a.number ? "Envoi…" : "Remplacer"}
                  </div>
                </div>
                <p className="mt-2 text-[12px] text-ink-2">
                  <span className="text-ink-3">{a.numeral}</span> {a.name}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
