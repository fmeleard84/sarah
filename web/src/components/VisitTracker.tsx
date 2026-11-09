"use client";

import { useEffect } from "react";

/** Signale une visite au serveur, une fois par onglet (le A de la mesure). */
export function VisitTracker() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("mc_visit")) return;
      sessionStorage.setItem("mc_visit", "1");
    } catch {
      // stockage indisponible : on compte quand même, au pire deux fois
    }
    const q = new URLSearchParams(location.search);
    const body = {
      path: location.pathname,
      referrer: document.referrer,
      utm_source: q.get("utm_source") ?? undefined,
      utm_medium: q.get("utm_medium") ?? undefined,
      utm_campaign: q.get("utm_campaign") ?? undefined,
    };
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(() => {});
  }, []);
  return null;
}

/** Exclut ce navigateur de la mesure (posé en ouvrant l'admin). */
export function NoTrack() {
  useEffect(() => {
    document.cookie = "mc_notrack=1; path=/; max-age=31536000; samesite=lax";
  }, []);
  return null;
}
