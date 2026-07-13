import type { Metadata } from "next";
import { Sora, Manrope, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

// Sora — headings, buttons, UI, forms, badges, stats (~70%)
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

// Manrope — body text and captions (~25%)
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

// Bricolage Grotesque — eyebrow badges only (~5%)
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-eyebrow",
  display: "swap",
});

export const metadata: Metadata = {
  // Title template lives here only, so per-page titles read "<Page> | Duurzame
  // Vlaggen". The homepage sets an absolute title to avoid a doubled suffix.
  title: {
    default: "Duurzame Vlaggen — biologisch afbreekbaar | Sign Company",
    template: "%s | Duurzame Vlaggen",
  },
  description:
    "Biologisch afbreekbare vlaggen voor bedrijven: banier-, mast-, gevelvlaggen en beachflags. CSRD-proof, circulair geproduceerd en binnen 5 werkdagen geleverd door Sign Company B.V.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${sora.variable} ${manrope.variable} ${bricolage.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
