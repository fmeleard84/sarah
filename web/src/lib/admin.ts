import "server-only";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";

/**
 * Accès à l'espace d'administration : un compte créé (non anonyme) dont le
 * profil porte is_admin. Le drapeau ne se pose que côté serveur.
 *
 * Pour une page : 404 plutôt qu'une redirection, l'admin n'a pas à être visible.
 */
export async function requireAdmin() {
  const s = await getSession();
  if (!s.user || s.isAnonymous || !s.profile?.is_admin) notFound();
  return { user: s.user, profile: s.profile };
}

/** Pour une action serveur ou une route d'API : lève une erreur si l'accès est refusé. */
export async function assertAdmin() {
  const s = await getSession();
  if (!s.user || s.isAnonymous || !s.profile?.is_admin) throw new Error("Accès réservé à l'administration.");
  return { user: s.user, profile: s.profile };
}

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
