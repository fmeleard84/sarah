import Link from "next/link";
import { getLocale } from "@/lib/session";
import { getDict } from "@/lib/texts";
import { siteFonts } from "@/components/landing/fonts";
import "./magazine.css";

/** Gabarit du Magazine : en-tête « Morning Cards · Magazine », pied avec « Tirer une carte ». */
export default async function MagazineLayout({ children }: { children: React.ReactNode }) {
  const t = await getDict(await getLocale());
  return (
    <div className={`mg ${siteFonts}`}>
      <header className="mg-head">
        <Link href="/magazine">
          <strong>Morning Cards</strong>
          <span>{t.magazine.title}</span>
        </Link>
      </header>
      {children}
      <footer className="mg-foot">
        <Link href="/" aria-label="Morning Cards">
          <img src="/brand/picto.svg" alt="" width={28} height={36} />
        </Link>
        <Link href="/bienvenue">{t.magazine.draw}</Link>
      </footer>
    </div>
  );
}
