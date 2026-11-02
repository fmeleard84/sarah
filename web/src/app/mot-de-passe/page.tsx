import { getLocale } from "@/lib/session";
import { DICTS } from "@/lib/i18n";
import { AuthFrame } from "@/components/AuthFrame";
import { ForgotForm } from "./ForgotForm";

export default async function Forgot() {
  const locale = await getLocale();
  const t = DICTS[locale].auth;
  return (
    <AuthFrame title={t.resetTitle} sub={t.resetSub}>
      <ForgotForm locale={locale} />
    </AuthFrame>
  );
}
