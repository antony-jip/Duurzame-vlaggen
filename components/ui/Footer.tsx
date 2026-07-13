import Link from "next/link";
import Image from "next/image";
import styles from "./Footer.module.css";
import { Container } from "./Container";
import { ArrowRight } from "./Icon";
import { getAllProducts } from "@/lib/catalog/products";

// Derive from the catalogue so slugs never drift from the real product pages.
const PRODUCT_LINKS = getAllProducts().map((p) => ({
  href: `/collectie/${p.slug}`,
  label: p.name,
}));

// Segment-landingpagina's.
const AUDIENCE_LINKS = [
  { href: "/voor-bedrijven", label: "Voor bedrijven" },
  { href: "/voor-gemeenten", label: "Voor gemeenten" },
  { href: "/voor-verenigingen", label: "Voor verenigingen" },
];

// Verdieping: duurzaamheid, materiaal en de kennisbank.
const KNOWLEDGE_LINKS = [
  { href: "/duurzaamheid", label: "Duurzaamheid" },
  { href: "/materiaal", label: "Materiaal" },
  { href: "/certificeringen", label: "Certificeringen" },
  { href: "/csrd", label: "CSRD" },
  { href: "/kennisbank", label: "Kennisbank" },
];

// Service en bedrijf.
const SERVICE_LINKS = [
  { href: "/veelgestelde-vragen", label: "Veelgestelde vragen" },
  { href: "/garantie", label: "Garantie" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/contact", label: "Offerte aanvragen" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footerWrap}>
      {/* Wapper-golf de footer in — zelfde overgang als hero en missieband. */}
      <svg
        className={styles.topWave}
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z"
          fill="currentColor"
        />
      </svg>
      <div className={styles.footer}>
      <Container>
        {/* Oversized sign-off — the brand thesis as a closing statement. */}
        <div className={styles.signoff}>
          <span className={styles.kicker}>Sign Company B.V.</span>
          <p className={styles.statement}>
            Laat je merk <em>wapperen</em>, niet de planeet belasten.
          </p>
          <Link href="/contact" className={styles.signoffLink}>
            Vraag een gratis staal aan <ArrowRight size={20} />
          </Link>
        </div>

        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <Image
              src="/logo-full-light.png"
              alt="Duurzame Vlaggen"
              width={280}
              height={27}
              className={styles.logo}
            />
            <p className={styles.tagline}>
              Biologisch afbreekbare vlaggen voor bedrijven die hun merk laten
              wapperen zonder de planeet te belasten.
            </p>
            <address className={styles.contact}>
              <span>Sign Company B.V.</span>
              <span>Enkhuizen, Nederland</span>
              <a href="mailto:info@duurzame-vlaggen.nl">
                info@duurzame-vlaggen.nl
              </a>
              <a href="tel:+31850608963">085 060 8963</a>
            </address>
          </div>

          <nav aria-labelledby="footer-products">
            <h2 id="footer-products" className={styles.colTitle}>
              Producten
            </h2>
            <div className={styles.list}>
              {PRODUCT_LINKS.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <nav aria-labelledby="footer-audience">
            <h2 id="footer-audience" className={styles.colTitle}>
              Voor wie
            </h2>
            <div className={styles.list}>
              {AUDIENCE_LINKS.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <nav aria-labelledby="footer-knowledge">
            <h2 id="footer-knowledge" className={styles.colTitle}>
              Kennis
            </h2>
            <div className={styles.list}>
              {KNOWLEDGE_LINKS.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <nav aria-labelledby="footer-service">
            <h2 id="footer-service" className={styles.colTitle}>
              Service
            </h2>
            <div className={styles.list}>
              {SERVICE_LINKS.map((item) => (
                <Link key={item.label} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className={styles.bottom}>
          <span>
            &copy; {year} Sign Company B.V. — Alle rechten voorbehouden.
          </span>
          <div className={styles.bottomLinks}>
            <Link href="/privacyverklaring">Privacy</Link>
            <Link href="/cookiebeleid">Cookies</Link>
            <Link href="/algemene-voorwaarden">Algemene voorwaarden</Link>
          </div>
        </div>
      </Container>
      </div>
    </footer>
  );
}
