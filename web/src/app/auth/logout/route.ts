import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_COOKIE_NAME } from "@/lib/supabase/config";

/**
 * Déconnexion côté serveur : un simple formulaire POST, sans dépendre du
 * JavaScript ni du stockage du navigateur. On révoque la session puis on
 * efface explicitement les cookies de session (y compris les morceaux .0, .1).
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});

  const store = await cookies();
  for (const c of store.getAll()) {
    if (c.name.startsWith(SUPABASE_COOKIE_NAME)) store.delete(c.name);
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  return NextResponse.redirect(`${origin}/connexion`, 303);
}
