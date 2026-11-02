"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DICTS, type Locale } from "@/lib/i18n";

export function ResetForm({ locale }: { locale: Locale }) {
  const t = DICTS[locale].auth;
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError(t.weak);
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(t.generic);
      setBusy(false);
      return;
    }
    // Retour à l'accueil de tirage (et non un écran intermédiaire, bug du 19 juin).
    router.push("/tirage");
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <div className="relative">
        <input
          className="field pr-16"
          type={show ? "text" : "password"}
          placeholder={t.newPassword}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-0 top-3 text-[12px] text-ink-3">
          {show ? t.hidePassword : t.showPassword}
        </button>
      </div>
      {error && <p className="mt-4 text-[13px] text-rose">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary label mt-8 w-full">
        {t.save}
      </button>
    </form>
  );
}
