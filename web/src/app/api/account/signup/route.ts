import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * Création de compte.
 *
 * Pendant l'onboarding, la session est anonyme : on la convertit (email et mot
 * de passe ajoutés au même utilisateur), ce qui garde la conversation en cours
 * et le deck choisi. Hors onboarding, c'est une inscription classique.
 * L'offre Exploration démarre à cet instant.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const firstName = String(body.firstName ?? "").trim().slice(0, 60);
  const birthdate = /^\d{4}-\d{2}-\d{2}$/.test(body.birthdate ?? "") ? body.birthdate : null;
  const locale = body.locale === "en" ? "en" : "fr";

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "weak" }, { status: 400 });
  if (!body.consent) return NextResponse.json({ error: "consent" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createServiceClient();

  let userId: string;
  if (user?.is_anonymous) {
    // L'API d'administration pose email et mot de passe sans email de
    // confirmation : la session du navigateur reste valide, on la rafraîchit.
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName },
    });
    if (error) {
      const exists = /already|registered|exists/i.test(error.message);
      return NextResponse.json({ error: exists ? "exists" : "generic" }, { status: exists ? 409 : 500 });
    }
    // Poser un mot de passe révoque les sessions en cours, dont celle du
    // navigateur : on en ouvre une neuve, écrite dans les cookies de la réponse.
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return NextResponse.json({ error: "generic" }, { status: 500 });
    userId = user.id;
  } else {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { first_name: firstName } } });
    if (error || !data.user) {
      const exists = /already|registered|exists/i.test(error?.message ?? "");
      return NextResponse.json({ error: exists ? "exists" : "generic" }, { status: exists ? 409 : 500 });
    }
    userId = data.user.id;
  }

  await admin
    .from("profiles")
    .update({
      first_name: firstName || null,
      birthdate,
      locale,
      plan: "exploration",
      plan_started_at: new Date().toISOString(),
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", userId);

  sendWelcomeEmail(email, firstName, locale).catch((e) => console.error("[welcome]", e));
  return NextResponse.json({ ok: true });
}
