"use client";

import { useEffect } from "react";

export function reportError(error: { message?: string; stack?: string; digest?: string }) {
  try {
    navigator.sendBeacon?.(
      "/api/client-error",
      new Blob([JSON.stringify({ message: error.message, stack: error.stack, digest: error.digest, path: location.pathname })], { type: "application/json" }),
    );
  } catch {
    // le signalement ne doit jamais aggraver la panne
  }
}

/** Remonte au serveur les erreurs JavaScript non rattrapées. */
export function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => reportError(e.error ?? { message: e.message });
    const onRejection = (e: PromiseRejectionEvent) => reportError(e.reason instanceof Error ? e.reason : { message: String(e.reason) });
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
