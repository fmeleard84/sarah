"use client";

import { useEffect } from "react";
import { reportError } from "@/components/ErrorReporter";

/** Dernier filet : erreur dans la mise en page racine elle-même. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    reportError(error);
  }, [error]);
  return (
    <html lang="fr">
      <body style={{ background: "#FEFCFA", color: "#2C2825", fontFamily: "system-ui", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 24 }}>une erreur est survenue.</p>
          <button onClick={() => location.reload()} style={{ marginTop: 24, background: "#558BBB", color: "#FEFCFA", border: 0, padding: "14px 28px", letterSpacing: ".18em", fontSize: 12 }}>
            RECHARGER
          </button>
        </div>
      </body>
    </html>
  );
}
