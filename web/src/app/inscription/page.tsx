import { getLocale } from "@/lib/session";
import { getDict } from "@/lib/texts";
import { AuthFrame } from "@/components/AuthFrame";
import { SignupPage } from "./SignupPage";

/** Inscription hors onboarding (lien partagé, session anonyme arrivée au bout). */
export default async function Signup() {
  const locale = await getLocale();
  const t = (await getDict(locale)).auth;
  return (
    <AuthFrame title={t.signupTitle} sub={t.signupSub}>
      <SignupPage locale={locale} />
    </AuthFrame>
  );
}
