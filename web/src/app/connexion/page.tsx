import { getLocale } from "@/lib/session";
import { getDict } from "@/lib/texts";
import { AuthFrame } from "@/components/AuthFrame";
import { LoginForm } from "./LoginForm";

export default async function Login() {
  const locale = await getLocale();
  const t = (await getDict(locale)).auth;
  return (
    <AuthFrame title={t.loginTitle} sub={t.loginSub}>
      <LoginForm locale={locale} />
    </AuthFrame>
  );
}
