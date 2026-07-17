import type { Metadata } from "next";
import { headers } from "next/headers";
import { Sora, Manrope, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import {
  SITE_NAME,
  OG_IMAGE,
  siteUrlForHost,
  htmlLangForHost,
  ogLocaleForHost,
  hreflangAlternates,
} from "@/lib/seo";

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

export async function generateMetadata(): Promise<Metadata> {
  // Host-aware: één Vercel-project bedient vijf marktdomeinen, dus canonical,
  // hreflang, og:locale en <html lang> moeten per request-host verschillen.
  // Onbekende hosts (Vercel-preview, lokaal) vallen terug op het .nl-domein.
  const host = (await headers()).get("host");
  const site = siteUrlForHost(host);

  return {
    // metadataBase maakt relatieve canonical- en OG-URL's absoluut tegen het
    // HUIDIGE marktdomein — zo canonicaliseert elk domein naar zichzelf i.p.v.
    // als duplicaat naar .nl te vouwen.
    metadataBase: new URL(site),
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
    // Self-referentiële canonical (relatief → lost op tegen de host-aware
    // metadataBase) + de hreflang-cluster over alle vijf marktdomeinen + x-default.
    // Per-pagina hreflang: geef in elke page-`generateMetadata` de eigen
    // `alternates: pageAlternates("/pad")` mee (helper in lib/seo.ts).
    alternates: { canonical: "/", languages: hreflangAlternates("/") },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: ogLocaleForHost(host),
      url: site,
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
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // <html lang> volgt het marktdomein (nl-NL / nl-BE / de-DE / fr-FR / en) zodat
  // screenreaders en zoekmachines de juiste taal zien op elk domein.
  const lang = htmlLangForHost((await headers()).get("host"));
  return (
    <html
      lang={lang}
      className={`${sora.variable} ${manrope.variable} ${bricolage.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
