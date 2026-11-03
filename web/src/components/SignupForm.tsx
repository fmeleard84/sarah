"use client";

import Link from "next/link";
import { useState } from "react";
import { type Locale } from "@/lib/i18n";
import { useDict } from "@/components/I18nProvider";

/**
 * Création de compte (mur d'inscription de l'onboarding et page /inscription).
 * Pendant l'onboarding, le serveur convertit la session anonyme : la
 * conversation et le deck choisi sont conservés.
 */
export function SignupForm({ locale, onDone }: { locale: Locale; onDone: () => void }) {
  const t = useDict(locale);
  const [form, setForm] = useState({ firstName: "", email: "", password: "", birthdate: "", consent: false });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) return setError(t.auth.weak);
    setBusy(true);
    setError(null);
    const res = await fetch("/api/account/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, locale }),
    });
    if (res.ok) return onDone();
    const body = await res.json().catch(() => ({}));
    setError(body.error === "exists" ? t.auth.exists : body.error === "weak" ? t.auth.weak : t.auth.generic);
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="pb-2">
      <h2 className="title text-[28px]">{t.wall.title}</h2>
      <p className="mt-2 text-[14px] text-ink-2">{t.wall.body}</p>

      <div className="mt-6 space-y-2">
        <input className="field" placeholder={t.wall.firstName} value={form.firstName} onChange={set("firstName")} autoComplete="given-name" required />
        <input className="field" type="email" placeholder={t.wall.email} value={form.email} onChange={set("email")} autoComplete="email" required />
        <div className="relative">
          <input
            className="field pr-16"
            type={show ? "text" : "password"}
            placeholder={t.wall.password}
            value={form.password}
            onChange={set("password")}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-0 top-3 text-[12px] text-ink-3">
            {show ? t.auth.hidePassword : t.auth.showPassword}
          </button>
        </div>
        <label className="block">
          <span className="sr-only">{t.wall.birthdate}</span>
          <input className="field" type="date" value={form.birthdate} onChange={set("birthdate")} aria-label={t.wall.birthdate} />
          <span className="mt-1 block text-[12px] text-ink-3">{t.wall.birthdateHelp}</span>
        </label>
      </div>

      <label className="mt-5 flex items-start gap-3 text-[12px] leading-relaxed text-ink-2">
        <input type="checkbox" checked={form.consent} onChange={set("consent")} required className="mt-0.5 accent-[#558BBB]" />
        <span>{t.wall.consent}</span>
      </label>

      {error && <p className="mt-4 text-[13px] text-rose">{error}</p>}

      <button type="submit" disabled={busy} className="btn-primary label mt-6 w-full">
        {t.wall.cta}
      </button>
      <p className="mt-3 text-center text-[12px] text-ink-3">{t.wall.reassure}</p>
      <p className="mt-4 text-center text-[13px]">
        <Link href="/connexion" className="btn-link text-ink-2">
          {t.wall.already}
        </Link>
      </p>
    </form>
  );
}
