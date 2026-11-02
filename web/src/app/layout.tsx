import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { getLocale } from "@/lib/session";
import { ErrorReporter } from "@/components/ErrorReporter";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "Morning Cards",
  description: "Une carte. Une conversation. Un insight.",
  icons: { icon: "/brand/favicon.svg", apple: "/brand/favicon-180.png" },
  robots: { index: false, follow: false },
  // Le texte est déjà dans la langue choisie : la traduction automatique du
  // navigateur réécrirait le DOM pendant que React y écrit le flux de l'IA.
  other: { google: "notranslate" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FEFCFA",
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} translate="no" className={`${cormorant.variable} ${dmSans.variable} notranslate`}>
      <body>
        <ErrorReporter />
        {children}
      </body>
    </html>
  );
}
