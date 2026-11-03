"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/Toast";
import { createDeck } from "../actions";

export function NewDeck() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await createDeck(name);
    setBusy(false);
    if (!res.ok) return toast(res.error);
    router.push(`/admin/decks/${res.slug}`);
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn-primary label">
        Nouveau deck
      </button>
    );

  return (
    <form onSubmit={submit} className="flex items-center gap-3">
      <input autoFocus className="admin-input w-56" placeholder="Nom du deck" value={name} onChange={(e) => setName(e.target.value)} />
      <button disabled={busy || !name.trim()} className="btn-primary label">
        Créer
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-[13px] text-ink-3 underline">
        Annuler
      </button>
    </form>
  );
}
