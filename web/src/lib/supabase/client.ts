import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_COOKIE_NAME, browserUrl } from "./config";

/** Client Supabase pour les composants qui tournent dans le navigateur. */
export function createClient() {
  return createBrowserClient(browserUrl(), SUPABASE_ANON_KEY, {
    cookieOptions: { name: SUPABASE_COOKIE_NAME },
  });
}
