import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_COOKIE_NAME, SUPABASE_SERVER_URL } from "./config";

/**
 * Client Supabase pour les composants serveur, les gestionnaires de route et
 * les actions serveur. La session vit dans les cookies : c'est ce client qui
 * les lit et les rafraîchit.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_SERVER_URL, SUPABASE_ANON_KEY, {
    cookieOptions: { name: SUPABASE_COOKIE_NAME },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Écrire un cookie depuis un composant serveur est interdit : c'est
          // le proxy qui rafraîchit la session, et il le fait déjà.
        }
      },
    },
  });
}

/**
 * L'utilisateur connecté, ou null.
 *
 * On passe par getUser() et non par getSession() : getSession() se contente de
 * lire le cookie, qui est modifiable par le client. getUser() fait valider le
 * jeton par le serveur d'authentification. Pour décider d'un accès, seule la
 * seconde réponse a une valeur.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
