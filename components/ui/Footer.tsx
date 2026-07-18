import Link from "next/link";
import Image from "next/image";
import styles from "./Footer.module.css";
import { Container } from "./Container";
import { ArrowRight, Leaf, Recycle, ShieldCheck, Truck } from "./Icon";
import { BEDRIJF, bedrijfsAdresRegels } from "@/lib/bedrijf";
import { getAllProducts } from "@/lib/catalog/products";

// Derive from the catalogue so slugs never drift from the real product pages.
// Landenvlaggen is geen eigen catalogusproduct (het is de mastvlag met een
// automatisch drukbestand) en staat er daarom handmatig bij.
const PRODUCT_LINKS = [
  ...getAllProducts().map((p) => ({
    href: `/collectie/${p.slug}`,
    label: p.name,
  })),
  { href: "/landenvlaggen", label: "Landenvlaggen" },
];

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
        {/* Oversized sign-off — the brand thesis as a closing statement.
            Erachter: een zee vol plastic. Dát is waar "niet de planeet
            belasten" over gaat, dus staat de belofte er letterlijk in. Het beeld
            is weggemaskeerd met een gradient en lost op in het forest, zodat het
            een sfeer is en geen foto in een kader. */}
        <div className={styles.signoff}>
          {/* Eigen wikkel: dit blok zit in een Container, dus zonder deze
              full-bleed laag was het beeld nooit breder dan de container en zag
              je zijn randen als een rechthoek in het vlak liggen. */}
          <div className={styles.signoffZeeWrap} aria-hidden="true">
            <Image
              src="/footer/zee-met-plastic.webp"
              alt=""
              fill
              sizes="100vw"
              className={styles.signoffZee}
            />
          </div>
          <span className={styles.kicker}>Duurzame Vlaggen</span>
          <p className={styles.statement}>
            Laat je merk <em>wapperen</em>, niet de planeet belasten.
          </p>
          {/* Was "Vraag een gratis staal aan", en die stalen versturen we niet.
              Deze link staat op élke pagina, dus die belofte stond overal.
              Nu stuurt hij naar de configurator, waar de verkoop gebeurt. */}
          <Link href="/collectie" className={styles.signoffLink}>
            Stel je vlag samen <ArrowRight size={20} />
          </Link>
        </div>

        {/* Zekerheden-rij — de winkelbeloftes nog één keer, vlak voor de
            linkkolommen. Dit is waar een twijfelende bezoeker eindigt. */}
        <ul className={styles.trustRow}>
          <li>
            <ShieldCheck size={17} aria-hidden="true" />
            iDEAL, creditcard of zakelijk op rekening
          </li>
          <li>
            <Truck size={17} aria-hidden="true" />
            Binnen 5 werkdagen geleverd
          </li>
          <li>
            <Leaf size={17} aria-hidden="true" />
            100% biologisch afbreekbaar doek
          </li>
          <li>
            <Recycle size={17} aria-hidden="true" />
            CSRD-materiaalpaspoort bij elke order
          </li>
        </ul>

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
            {/* Geen mailadres: alles loopt via /contact, zodat aanvragen
                gestructureerd binnenkomen in plaats van als losse mail. */}
            <address className={styles.contact}>
              <span>{BEDRIJF.handelsnaam}</span>
              {bedrijfsAdresRegels().map((regel) => (
                <span key={regel}>{regel}</span>
              ))}
              <Link href="/contact">Stel je vraag</Link>
              <a href="tel:+31850608963">{BEDRIJF.telefoon}</a>
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
            &copy; {year} <span>{BEDRIJF.rechtspersoon}</span> · Alle rechten
            voorbehouden.
            <span className={styles.juridisch}>
              {[
                BEDRIJF.kvkBevestigd ? `KvK ${BEDRIJF.kvkNummer}` : null,
                `Btw ${BEDRIJF.btwNummer}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
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
