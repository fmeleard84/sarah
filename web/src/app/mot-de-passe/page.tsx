import { getLocale } from "@/lib/session";
import { getDict } from "@/lib/texts";
import { AuthFrame } from "@/components/AuthFrame";
import { ForgotForm } from "./ForgotForm";

export default async function Forgot() {
  const locale = await getLocale();
  const t = (await getDict(locale)).auth;
  return (
    <AuthFrame title={t.resetTitle} sub={t.resetSub}>
      <ForgotForm locale={locale} />
    </AuthFrame>
  );
}
