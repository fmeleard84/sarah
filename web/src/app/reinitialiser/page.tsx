import { redirect } from "next/navigation";
import { getLocale, getSession } from "@/lib/session";
import { DICTS } from "@/lib/i18n";
import { AuthFrame } from "@/components/AuthFrame";
import { ResetForm } from "./ResetForm";

export default async function Reset() {
  const { user } = await getSession();
  if (!user || user.is_anonymous) redirect("/connexion");
  const locale = await getLocale();
  return (
    <AuthFrame title={DICTS[locale].auth.resetTitle}>
      <ResetForm locale={locale} />
    </AuthFrame>
  );
}
