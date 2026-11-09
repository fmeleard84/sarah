"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/Toast";
import { createArticle } from "./actions";

export function NewArticle() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await createArticle(title);
    setBusy(false);
    if (!res.ok) return toast(res.error);
    router.push(`/admin/magazine/${res.id}`);
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn-primary label">
        Nouvel article
      </button>
    );
  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
      <input autoFocus className="admin-input w-72" placeholder="Titre de l'article" value={title} onChange={(e) => setTitle(e.target.value)} />
      <button disabled={busy || !title.trim()} className="btn-primary label">
        Créer
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-[13px] text-ink-3 underline">
        Annuler
      </button>
    </form>
  );
}
