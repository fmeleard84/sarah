"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Locale } from "@/lib/i18n";
import { useDict } from "@/components/I18nProvider";

export function LoginForm({ locale }: { locale: Locale }) {
  const t = useDict(locale).auth;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    // Une session anonyme d'onboarding en cours est abandonnée au profit du compte.
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(/invalid/i.test(error.message) ? t.invalid : t.generic);
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <div className="space-y-2">
        <input className="field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <div className="relative">
          <input
            className="field pr-16"
            type={show ? "text" : "password"}
            placeholder={locale === "en" ? "Password" : "Mot de passe"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-0 top-3 text-[12px] text-ink-3">
            {show ? t.hidePassword : t.showPassword}
          </button>
        </div>
      </div>
      <p className="mt-3 text-right text-[13px]">
        <Link href="/mot-de-passe" className="btn-link text-ink-2">
          {t.forgot}
        </Link>
      </p>
      {error && <p className="mt-4 text-[13px] text-rose">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary label mt-8 w-full">
        {t.login}
      </button>
      <p className="mt-8 text-center text-[13px]">
        <Link href="/bienvenue" className="btn-link text-ink-2">
          {t.noAccount}
        </Link>
      </p>
    </form>
  );
}
