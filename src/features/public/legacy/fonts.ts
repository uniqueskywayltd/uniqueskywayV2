import { Arimo } from "next/font/google";

/** Public HP visual parity font (legacy Arimo). Server layout only. */
export const legacyArimo = Arimo({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-legacy-arimo",
  display: "swap",
});
