"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";
import { Container } from "./Container";
import { Menu } from "./Icon";
import { getAllProducts } from "@/lib/catalog/products";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/collectie", label: "Collectie" },
  { href: "/duurzaamheid", label: "Duurzaamheid" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/contact", label: "Contact" },
] as const;

const PRODUCT_LINKS = getAllProducts().map((p) => ({ href: `/collectie/${p.slug}`, label: p.name }));

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      {/* Primary bar — forest green, matching the brand's dark header. */}
      <div className={styles.topbar}>
        <Container className={styles.inner} as="div">
          <Link href="/" className={styles.brand} aria-label="Duurzame Vlaggen — home">
            <Image
              className={styles.logo}
              src="/logo-full-light.png"
              alt="Duurzame Vlaggen"
              width={340}
              height={33}
              priority
            />
          </Link>

          <nav className={styles.nav} aria-label="Hoofdnavigatie">
            {NAV_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className={styles.link}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <Link href="/contact" className={styles.cta}>
              Offerte
            </Link>
          </div>

          <button
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Menu sluiten" : "Menu openen"}
            onClick={() => setOpen((v) => !v)}
          >
            <Menu size={22} />
          </button>
        </Container>
      </div>

      {/* Secondary bar — product categories. */}
      <div className={styles.subbar}>
        <Container as="nav" aria-label="Productcategorieën" className={styles.subinner}>
          {PRODUCT_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className={styles.subLink}>
              {item.label}
            </Link>
          ))}
        </Container>
      </div>

      {open && (
        <div id="mobile-menu" className={styles.panel}>
          <Container as="nav" aria-label="Mobiele navigatie">
            <div className={styles.panelNav}>
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.panelLink}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <span className={styles.panelHeading}>Producten</span>
              {PRODUCT_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.panelLink}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className={styles.panelCta}>
                <Link href="/contact" className={styles.cta} onClick={() => setOpen(false)}>
                  Offerte aanvragen
                </Link>
              </div>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
