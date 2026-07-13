import { Header, Footer } from "@/components/ui";
import { CartProvider } from "@/components/cart/CartProvider";
import { getUiCatalog } from "@/lib/i18n";
import {
  SITE_URL,
  SITE_NAME,
  COMPANY_NAME,
  LOGO_URL,
  jsonLd,
} from "@/lib/seo";

/**
 * Organisatie + website als JSON-LD. Staat in de storefront-shell zodat elke
 * publieke pagina de bedrijfs- en site-identiteit meegeeft aan zoekmachines,
 * terwijl /admin (eigen root-layout) hier buiten valt.
 */
const ORG_JSON_LD = jsonLd({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: COMPANY_NAME,
  alternateName: SITE_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
  description:
    "Biologisch afbreekbare vlaggen voor bedrijven, gemeenten en verenigingen — CSRD-proof en zonder microplastics.",
  areaServed: "NL",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["nl"],
  },
});

const WEBSITE_JSON_LD = jsonLd({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "nl-NL",
  publisher: { "@type": "Organization", name: COMPANY_NAME },
});

/**
 * Storefront shell — everything a customer sees (Header + Footer + cart state).
 * Lives in its own route group so `app/admin/**` renders without this chrome:
 * the root layout only provides <html>/<body>/fonts/globals.
 */
export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const catalog = await getUiCatalog();

  return (
    <CartProvider catalog={catalog}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ORG_JSON_LD }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: WEBSITE_JSON_LD }}
      />
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </CartProvider>
  );
}
