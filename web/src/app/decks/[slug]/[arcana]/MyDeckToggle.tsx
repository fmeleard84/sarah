"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Locale } from "@/lib/i18n";
import { useDict } from "@/components/I18nProvider";
import { toast } from "@/components/Toast";

/** Ajoute cette version de l'arcane à My Deck, ou la retire. */
export function MyDeckToggle({ locale, cardId, arcana, pinned }: { locale: Locale; cardId: string; arcana: number; pinned: boolean }) {
  const t = useDict(locale).decks;
  const router = useRouter();
  const [isPinned, setPinned] = useState(pinned);

  async function toggle() {
    const res = await fetch("/api/my-deck", {
      method: isPinned ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isPinned ? { arcana } : { cardId }),
    });
    if (!res.ok) return;
    toast(isPinned ? t.toastRemoved : t.toastAdded);
    setPinned(!isPinned);
    router.refresh();
  }

  return (
    <button onClick={toggle} className="btn-link text-slate">
      {isPinned ? t.removeFromMine : t.addToMine}
    </button>
  );
}
