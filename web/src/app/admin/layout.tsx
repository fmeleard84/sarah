import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { Toaster } from "@/components/Toast";
import { NoTrack } from "@/components/VisitTracker";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = { title: "Administration · Morning Cards" };

/** Gabarit de l'admin : accès réservé, navigation en haut, pas de barre d'onglets mobile. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="min-h-dvh px-[10%] pb-24">
      <header className="sticky top-0 z-30 -mx-[12.5%] border-b border-rule bg-canvas/95 px-[12.5%] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-4">
          <a href="/admin" className="flex items-baseline gap-3">
            <span className="title text-[22px]">morning cards</span>
            <span className="label text-ink-3">admin</span>
          </a>
          <div className="flex items-center gap-6 text-[13px] text-ink-2">
            <span className="hidden sm:inline">{user.email}</span>
            <a href="/tirage" className="btn-link">
              Retour à l&apos;app
            </a>
          </div>
        </div>
        <AdminNav />
      </header>
      <main className="pt-10">{children}</main>
      <Toaster />
      <NoTrack />
    </div>
  );
}
