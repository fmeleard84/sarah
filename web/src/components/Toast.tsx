"use client";

import { useEffect, useState } from "react";

/**
 * Toast (spécification du 8 juillet) : fond encre, texte papier, 13 px,
 * sans icône, sans arrondi, au-dessus de la pill, 2,5 s.
 * Déclenché de n'importe où par toast("…").
 */
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("mc-toast", { detail: message }));
}

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 2500);
    };
    window.addEventListener("mc-toast", on);
    return () => {
      window.removeEventListener("mc-toast", on);
      clearTimeout(timer);
    };
  }, []);
  if (!msg) return null;
  return (
    <div role="status" className="fade-up fixed inset-x-0 bottom-28 z-50 flex justify-center px-6">
      <div className="bg-ink px-6 py-3 text-center text-[13px] text-canvas">{msg}</div>
    </div>
  );
}
