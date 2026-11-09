import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import { cookies } from "next/headers";
import { getLocale } from "@/lib/session";
import { THEME_COOKIE, isTheme } from "@/lib/theme";
import { ErrorReporter } from "@/components/ErrorReporter";
import { VisitTracker } from "@/components/VisitTracker";
import { I18nProvider } from "@/components/I18nProvider";
import { getTextOverrides } from "@/lib/texts";
import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument-sans" });

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
  const [locale, overrides, jar] = await Promise.all([getLocale(), getTextOverrides(), cookies()]);
  const stored = jar.get(THEME_COOKIE)?.value;
  const theme = isTheme(stored) ? stored : "light";
  return (
    <html lang={locale} translate="no" data-theme={theme} className={`${serif.variable} ${sans.variable} notranslate`}>
      <body>
        <ErrorReporter />
        <VisitTracker />
        <I18nProvider overrides={overrides}>{children}</I18nProvider>
      </body>
    </html>
  );
}
