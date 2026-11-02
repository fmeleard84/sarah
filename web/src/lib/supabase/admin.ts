import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SERVER_URL } from "./config";

/**
 * Client sans session, qui contourne la sécurité au niveau des lignes.
 *
 * Les tables de conversations n'ont que des politiques de lecture : seul le
 * serveur écrit un tirage, un message ou un changement d'offre, après avoir
 * vérifié la session et les droits. La clé n'est jamais préfixée NEXT_PUBLIC,
 * elle ne quitte donc pas le serveur.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante");

  return createSupabaseClient(SUPABASE_SERVER_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
