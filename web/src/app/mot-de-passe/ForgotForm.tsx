"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Locale } from "@/lib/i18n";
import { useDict } from "@/components/I18nProvider";

export function ForgotForm({ locale }: { locale: Locale }) {
  const t = useDict(locale).auth;
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reinitialiser`,
    });
    // Même réponse que le compte existe ou non : on ne révèle pas qui est inscrite.
    setSent(true);
    setBusy(false);
  }

  if (sent) return <p className="bg-surface px-4 py-3 text-[14px]">{t.resetSent}</p>;
  return (
    <form onSubmit={submit}>
      <input className="field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      <button type="submit" disabled={busy} className="btn-primary label mt-8 w-full">
        {t.send}
      </button>
    </form>
  );
}
