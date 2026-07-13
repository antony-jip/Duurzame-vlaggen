import type { Metadata } from "next";
import { Sora, Manrope, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/ui";
import { CartProvider } from "@/components/cart/CartProvider";
import { getUiCatalog } from "@/lib/i18n";

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
  title: {
    default: "Duurzame Vlaggen — biologisch afbreekbaar | Sign Company",
    template: "%s | Duurzame Vlaggen",
  },
  description:
    "Biologisch afbreekbare vlaggen voor bedrijven: banier-, mast-, gevelvlaggen en beachflags. CSRD-proof, circulair geproduceerd en binnen 2–4 weken geleverd door Sign Company B.V.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const catalog = await getUiCatalog();

  return (
    <html
      lang="nl"
      className={`${sora.variable} ${manrope.variable} ${bricolage.variable}`}
    >
      <body>
        <CartProvider catalog={catalog}>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
