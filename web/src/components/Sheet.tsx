"use client";

import { useEffect } from "react";

/**
 * Bottom sheet : monte depuis le bas, voile derrière, fermeture au tap
 * extérieur ou par la croix. Texte seul, pas d'icônes à l'intérieur.
 */
export function Sheet({ open, onClose, children, dismissible = true }: { open: boolean; onClose: () => void; children: React.ReactNode; dismissible?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismissible && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, dismissible]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-ink/30 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => dismissible && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] max-w-[480px] overflow-y-auto bg-canvas px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-3 transition-transform duration-500 ease-[cubic-bezier(.22,.61,.36,1)] ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-6 h-[3px] w-9 rounded-full bg-rule" />
        {children}
      </div>
    </div>
  );
}
