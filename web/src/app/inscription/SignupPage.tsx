"use client";

import { useRouter } from "next/navigation";
import { SignupForm } from "@/components/SignupForm";
import type { Locale } from "@/lib/i18n";

export function SignupPage({ locale }: { locale: Locale }) {
  const router = useRouter();
  return (
    <SignupForm
      locale={locale}
      onDone={() => {
        router.push("/");
        router.refresh();
      }}
    />
  );
}
