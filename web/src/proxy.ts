import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_COOKIE_NAME, SUPABASE_SERVER_URL } from "@/lib/supabase/config";

/**
 * Proxy (ex-middleware, Next 16) : rafraîchit la session à chaque requête.
 * Les gardes d'accès sont dans les pages (requireSession / requireAccount).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_SERVER_URL, SUPABASE_ANON_KEY, {
    cookieOptions: { name: SUPABASE_COOKIE_NAME },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Ni l'API Supabase réécrite, ni les fichiers statiques.
  matcher: ["/((?!sb/|api/admin/cards|_next/static|_next/image|decks/|brand/|favicon|api/health|api/client-error).*)"],
};
