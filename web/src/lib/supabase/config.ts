/**
 * Adressage de Supabase.
 *
 * L'API n'a pas de sous-domaine à elle : l'application la sert sous /sb et
 * réécrit vers Kong (next.config.ts). Pas de DNS ni de certificat en plus, pas
 * de route Traefik à ajouter, pas de CORS. Côté serveur, on parle directement
 * au conteneur Kong sur le réseau Docker.
 */

/** URL vue par le navigateur, via la réécriture /sb. */
export const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "/sb";

/** URL vue par le serveur, directe vers Kong. */
export const SUPABASE_SERVER_URL = process.env.SUPABASE_INTERNAL_URL ?? SUPABASE_PUBLIC_URL;

export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Nom du cookie de session, imposé. Sinon supabase-js le déduit de l'URL, et le
 * navigateur (morningcards.vaya.rip) et le serveur (morningcards-kong-1) ne
 * liraient pas le même cookie.
 */
export const SUPABASE_COOKIE_NAME = "sb-mc-auth-token";

/** supabase-js exige une URL absolue : on la reconstruit depuis l'origine. */
export function browserUrl(): string {
  if (SUPABASE_PUBLIC_URL.startsWith("http")) return SUPABASE_PUBLIC_URL;
  if (typeof window === "undefined") return SUPABASE_SERVER_URL;
  return `${window.location.origin}${SUPABASE_PUBLIC_URL}`;
}
