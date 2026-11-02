import { getLocale } from "@/lib/session";
import { DICTS } from "@/lib/i18n";
import { AuthFrame } from "@/components/AuthFrame";
import { LoginForm } from "./LoginForm";

export default async function Login() {
  const locale = await getLocale();
  const t = DICTS[locale].auth;
  return (
    <AuthFrame title={t.loginTitle} sub={t.loginSub}>
      <LoginForm locale={locale} />
    </AuthFrame>
  );
}
