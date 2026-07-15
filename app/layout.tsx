import type { Metadata } from "next";
import { Sora, Manrope, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { SITE_URL, SITE_NAME, OG_IMAGE } from "@/lib/seo";

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
  // metadataBase maakt relatieve canonical- en OG-URL's absoluut. Volgt
  // NEXT_PUBLIC_APP_URL (Vercel = echt domein), fallback = productiedomein.
  metadataBase: new URL(SITE_URL),
  // Title template lives here only, so per-page titles read "<Page> | Duurzame
  // Vlaggen". The homepage sets an absolute title to avoid a doubled suffix.
  title: {
    default: "Duurzame Vlaggen — biologisch afbreekbaar",
    template: "%s | Duurzame Vlaggen",
  },
  description:
    "Biologisch afbreekbare vlaggen voor bedrijven: banier-, mast-, gevelvlaggen en beachflags. CSRD-proof, circulair geproduceerd en binnen 5 werkdagen geleverd.",
  keywords: [
    "duurzame vlaggen",
    "biologisch afbreekbare vlaggen",
    "vlaggen zonder microplastics",
    "CSRD vlaggen",
    "mastvlag",
    "baniervlag",
    "gevelvlag",
    "beachvlag",
    "vlaggenmast",
    "Flag-CiCLO",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: "Duurzame Vlaggen" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "nl_NL",
    url: SITE_URL,
    title: "Duurzame Vlaggen — biologisch afbreekbaar",
    description:
      "Biologisch afbreekbare vlaggen voor bedrijven: banier-, mast-, gevelvlaggen en beachflags. CSRD-proof, circulair geproduceerd en binnen 5 werkdagen geleverd.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Duurzame vlaggen wapperend aan vlaggenmasten",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Duurzame Vlaggen — biologisch afbreekbaar",
    description:
      "Biologisch afbreekbare vlaggen voor bedrijven: banier-, mast-, gevelvlaggen en beachflags. CSRD-proof en binnen 5 werkdagen geleverd.",
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
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
