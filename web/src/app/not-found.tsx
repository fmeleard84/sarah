import Link from "next/link";
import { getLocale } from "@/lib/session";
import { getDict } from "@/lib/texts";

export default async function NotFound() {
  const t = (await getDict(await getLocale())).errors;
  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col items-center justify-center px-6 text-center">
      <img src="/brand/picto.svg" alt="" className="h-10 w-auto" />
      <h1 className="title mt-10 text-[28px]">{t.notFound}</h1>
      <Link href="/" className="btn-primary label mt-8">
        {t.home}
      </Link>
    </main>
  );
}
