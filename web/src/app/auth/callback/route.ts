import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Retour des liens d'email (réinitialisation) : échange le code contre une session. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }
  return NextResponse.redirect(`${origin}/connexion`);
}
