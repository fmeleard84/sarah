import { Nav } from "@/components/Nav";
import { Toaster } from "@/components/Toast";
import type { Locale } from "@/lib/i18n";

/** Gabarit des écrans avec navigation : marges de 10 % à gauche et à droite, pill en bas. */
export function AppShell({ locale, firstName, children }: { locale: Locale; firstName: string | null; children: React.ReactNode }) {
  const initials = (firstName?.trim()[0] ?? "·").toUpperCase();
  return (
    <div className="min-h-dvh px-[10%] pb-36 pt-[max(env(safe-area-inset-top),20px)]">
      {children}
      <Nav locale={locale} initials={initials} />
      <Toaster />
    </div>
  );
}
