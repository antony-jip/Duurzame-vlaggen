import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header, Footer } from "@/components/ui";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartPaneel } from "@/components/cart/CartPaneel";
import { DictProvider } from "@/components/i18n/DictProvider";
import { getMessages } from "@/lib/i18n";
import { displayRateForMarket } from "@/lib/vat/rates";
import { SITE_URL, SITE_NAME, LOGO_URL, jsonLd } from "@/lib/seo";
import { BEDRIJF } from "@/lib/bedrijf";

/**
 * Organisatie + website als JSON-LD. Staat in de storefront-shell zodat elke
 * publieke pagina de bedrijfs- en site-identiteit meegeeft aan zoekmachines,
 * terwijl /admin (eigen root-layout) hier buiten valt.
 */
const ORG_JSON_LD = jsonLd({
  "@context": "https://schema.org",
  "@type": "Organization",
  // `name` is het merk waarop gezocht wordt; de rechtspersoon hoort in
  // `legalName`. Stond hier eerder omgekeerd (Sign Company als name).
  name: BEDRIJF.handelsnaam,
  legalName: BEDRIJF.rechtspersoon,
  vatID: BEDRIJF.btwNummer,
  alternateName: SITE_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
  // Eigen kennisdomein over het doek; wederzijdse verwijzing (dat domein
  // noemt ons als publisher) helpt Google de twee sites als één entiteit zien.
  sameAs: ["https://flag-ciclo.nl"],
  description:
    "Biologisch afbreekbare vlaggen voor bedrijven, gemeenten en verenigingen. Klaar voor de CSRD en zonder microplastics.",
  areaServed: "NL",
  // Adres + telefoon maken van de webshop een vindbaar, fysiek NL-bedrijf
  // (lokale SEO); de gegevens komen uit dezelfde bron als factuur en footer.
  address: {
    "@type": "PostalAddress",
    streetAddress: `${BEDRIJF.adres.straat}`,
    postalCode: BEDRIJF.adres.postcode,
    addressLocality: BEDRIJF.adres.plaats,
    addressCountry: "NL",
  },
  telephone: BEDRIJF.telefoon,
  email: BEDRIJF.email,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: BEDRIJF.telefoon,
    email: BEDRIJF.email,
    availableLanguage: ["nl"],
  },
});

const WEBSITE_JSON_LD = jsonLd({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "nl-NL",
  publisher: { "@type": "Organization", name: BEDRIJF.handelsnaam },
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
  const { catalog, market, dict } = await getMessages();

  return (
    <DictProvider dict={dict}>
      <CartProvider catalog={catalog} vatRatePct={displayRateForMarket(market)}>
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
        {/* Het winkelmand-paneel schuift open zodra er iets in de mand gaat, dus
            het moet op elke storefront-pagina bestaan. */}
        <CartPaneel />
        {/* Vercel Web Analytics. Staat bewust in de storefront-shell en niet in
            de root-layout: zo telt /admin niet mee in je eigen bezoekcijfers.
            Cookieloos, dus er is geen toestemmingsbanner voor nodig. */}
        <Analytics />
        {/* Core Web Vitals van échte bezoekers, per route. Google's velddata
            (CrUX) heeft meer verkeer nodig dan deze site voorlopig haalt, dus
            dit is de enige bron die vanaf de eerste bezoeker iets zegt. LCP,
            INP en CLS wegen mee in de ranking, vandaar dat het hier hoort en
            niet in de categorie "leuk om te hebben". */}
        <SpeedInsights />
      </CartProvider>
    </DictProvider>
  );
}
