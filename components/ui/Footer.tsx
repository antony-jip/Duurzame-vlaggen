import Link from "next/link";
import styles from "./Footer.module.css";
import { Container } from "./Container";
import { Leaf } from "./Icon";

const PRODUCT_LINKS = [
  { href: "/collectie/baniervlaggen", label: "Baniervlaggen" },
  { href: "/collectie/mastvlaggen", label: "Mastvlaggen" },
  { href: "/collectie/gevelvlaggen", label: "Gevelvlaggen" },
  { href: "/collectie/beachflags", label: "Beachflags" },
];

const COMPANY_LINKS = [
  { href: "/over-ons", label: "Over ons" },
  { href: "/duurzaamheid", label: "Duurzaamheid" },
  { href: "/offerte", label: "Offerte aanvragen" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <span className={styles.brand}>
              <span className={styles.mark} aria-hidden="true">
                <Leaf size={18} />
              </span>
              duurzame&nbsp;<b>vlaggen</b>
            </span>
            <p className={styles.tagline}>
              Biologisch afbreekbare vlaggen voor bedrijven die hun merk laten
              wapperen zonder de planeet te belasten. Een initiatief van Sign
              Company B.V.
            </p>
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

          <nav aria-labelledby="footer-company">
            <h2 id="footer-company" className={styles.colTitle}>
              Bedrijf
            </h2>
            <div className={styles.list}>
              {COMPANY_LINKS.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div>
            <h2 className={styles.colTitle}>Contact</h2>
            <address className={styles.contact}>
              <span>Sign Company B.V.</span>
              <a href="mailto:hallo@duurzame-vlaggen.nl">
                hallo@duurzame-vlaggen.nl
              </a>
              <a href="tel:+31850000000">085 000 00 00</a>
              <span>Nederland</span>
            </address>
          </div>
        </div>

        <div className={styles.bottom}>
          <span>
            &copy; {year} Sign Company B.V. — Alle rechten voorbehouden.
          </span>
          <div className={styles.bottomLinks}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/voorwaarden">Voorwaarden</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
