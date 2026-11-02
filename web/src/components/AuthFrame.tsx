/** Gabarit des écrans d'accès : wordmark, titre, formulaire. Pas de navigation. */
export function AuthFrame({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col px-6 pb-12 pt-[max(env(safe-area-inset-top),40px)]">
      <img src="/brand/wordmark.svg" alt="Morning Cards" className="mx-auto mt-6 h-[11px] w-auto" />
      <h1 className="title mt-16 text-[34px]">{title}</h1>
      {sub && <p className="mt-2 text-[15px] text-ink-2">{sub}</p>}
      <div className="mt-8">{children}</div>
    </main>
  );
}
