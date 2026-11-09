import { Cormorant_Garamond, DM_Sans } from "next/font/google";

// Typographie de la landing et du Magazine (brief de Sarah) : auto-hébergée par next/font.
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400"], style: ["normal", "italic"], variable: "--lp-serif", display: "swap" });
const sans = DM_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--lp-sans", display: "swap" });

export const siteFonts = `${serif.variable} ${sans.variable}`;
