"use client";

import Link from "next/link";
import { useEffect } from "react";
import { reportError } from "@/components/ErrorReporter";

/**
 * Plantage de l'écran de conversation : on le signale, puis on propose de
 * reprendre. Rien n'est perdu, chaque message est enregistré côté serveur à la
 * fin de son flux.
 */
export default function ConversationError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError(error);
  }, [error]);
  const en = typeof document !== "undefined" && document.documentElement.lang === "en";
  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col items-center justify-center px-6 text-center">
      <img src="/brand/picto.svg" alt="" className="h-10 w-auto" />
      <h1 className="title mt-10 text-[26px]">{en ? "the conversation was interrupted." : "la conversation s'est interrompue."}</h1>
      <p className="mt-2 text-[14px] text-ink-2">{en ? "Nothing is lost. Pick up where you left off." : "Rien n'est perdu. Reprends là où tu t'étais arrêtée."}</p>
      <button
        onClick={() => {
          reset();
          location.reload();
        }}
        className="btn-primary label mt-8"
      >
        {en ? "Pick up" : "Reprendre"}
      </button>
      <Link href="/" className="label mt-6 text-ink/40">
        {en ? "Back home" : "Accueil"}
      </Link>
    </main>
  );
}
