"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";
import { Container } from "./Container";
import {
  Menu,
  Close,
  Bag,
  ArrowRight,
  FlagBanier,
  FlagMast,
  FlagBeach,
  FlagGevel,
  FlagPole,
} from "./Icon";
import { useCart } from "@/components/cart/CartProvider";
import { getAllProducts } from "@/lib/catalog/products";
import { formatCurrency } from "@/lib/i18n/formatting";
import type { ComponentType } from "react";

const FLAG_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  baniervlag: FlagBanier,
  mastvlag: FlagMast,
  beachvlag: FlagBeach,
  gevelvlag: FlagGevel,
  vlaggenmast: FlagPole,
};

const NAV_LINKS = [
  { href: "/collectie", label: "Collectie" },
  { href: "/duurzaamheid", label: "Duurzaamheid" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/contact", label: "Contact" },
] as const;

/* Shop-USP's boven de balk — maakt in één oogopslag duidelijk dat je hier
   direct bestelt, niet alleen leest. */
const TOPBAR_USPS = [
  "Direct online bestellen",
  "Levertijd 5 werkdagen (NL)",
  "Gratis digitale drukproef",
] as const;

/* Productcategorieën als directe shop-navigatie (afgeleid van de catalogus). */
const PRODUCT_LINKS = getAllProducts().map((p) => ({
  href: `/collectie/${p.slug}`,
  label: p.name,
}));

/** Live cart count from the provider. Kept tiny so the rest of the header
 *  stays simple; guarded on `hydrated` to avoid an SSR/client flash. */
function CartLink() {
  const { count, hydrated } = useCart();
  const show = hydrated && count > 0;
  return (
    <Link href="/winkelwagen" className={styles.cart} aria-label={
      show ? `Winkelmand, ${count} artikel${count === 1 ? "" : "en"}` : "Winkelmand"
    }>
      <Bag size={20} />
      <span className={styles.cartWord}>Winkelmand</span>
      {show && (
        <span className={styles.cartCount} aria-hidden="true">
          {count}
        </span>
      )}
    </Link>
  );
}

/* Mega-menu content: the five products with photo + from-price, so the menu
   itself already feels like the shop. */
const MEGA_PRODUCTS = getAllProducts();

export function Header() {
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const { catalog } = useCart();

  // Grace-timer: het paneel blijft even open terwijl de muis van de
  // Collectie-link over de subnav naar het paneel beweegt.
  const megaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMega = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    setMega(true);
  };
  const scheduleCloseMega = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    megaTimer.current = setTimeout(() => setMega(false), 350);
  };
  useEffect(
    () => () => {
      if (megaTimer.current) clearTimeout(megaTimer.current);
    },
    [],
  );

  // Lock scroll while the full-screen menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close the mega panel on Escape for keyboard users.
  useEffect(() => {
    if (!mega) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMega(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mega]);

  return (
    <header className={styles.header}>
      <div className={styles.topbar}>
        <Container className={styles.topbarInner} as="div">
          {TOPBAR_USPS.map((usp) => (
            <span key={usp} className={styles.topbarItem}>
              <span aria-hidden="true" className={styles.topbarCheck}>
                ✓
              </span>
              {usp}
            </span>
          ))}
        </Container>
      </div>

      <Container className={styles.inner} as="div">
        <Link href="/" className={styles.brand} aria-label="Duurzame Vlaggen — home">
          {/* White full-logo asset — made for the forest bar. */}
          <Image
            className={styles.logo}
            src="/logo-full-light.png"
            alt="Duurzame Vlaggen"
            width={232}
            height={22}
            priority
          />
        </Link>

        <nav className={styles.nav} aria-label="Hoofdnavigatie">
          {NAV_LINKS.map((item) =>
            item.href === "/collectie" ? (
              <span
                key={item.href}
                className={styles.megaWrap}
                onMouseEnter={openMega}
                onMouseLeave={scheduleCloseMega}
              >
                <Link
                  href={item.href}
                  className={`${styles.link} ${mega ? styles.linkOpen : ""}`}
                  aria-expanded={mega}
                  onFocus={openMega}
                >
                  {item.label}
                  <span className={styles.chevron} aria-hidden="true" />
                </Link>
              </span>
            ) : (
              <Link key={item.href} href={item.href} className={styles.link}>
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className={styles.actions}>
          <CartLink />
          <Link href="/contact" className={styles.offerte}>
            Offerte
          </Link>
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Menu sluiten" : "Menu openen"}
            onClick={() => setOpen((v) => !v)}
          >
            <Menu size={24} />
          </button>
        </div>
      </Container>

      {/* Product-subnav — de winkelplanken direct onder de masthead. */}
      <nav className={styles.subnav} aria-label="Producten">
        <Container className={styles.subnavInner} as="div">
          {PRODUCT_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className={styles.subnavLink}>
              {item.label}
            </Link>
          ))}
        </Container>
      </nav>

      {/* Mega-menu — de winkel al ín het menu: merk-tegel, naam, vanaf-prijs. */}
      {mega && (
        <div
          className={styles.megaPanel}
          onMouseEnter={openMega}
          onMouseLeave={scheduleCloseMega}
        >
          <Container as="div">
            <div className={styles.megaGrid}>
              {MEGA_PRODUCTS.map((p) => {
                const FlagIcon = FLAG_ICONS[p.slug] ?? FlagMast;
                return (
                  <Link
                    key={p.slug}
                    href={`/collectie/${p.slug}`}
                    className={styles.megaCard}
                    data-accent={p.accent}
                    onClick={() => setMega(false)}
                  >
                    <span className={styles.megaTile}>
                      <FlagIcon size={24} aria-hidden="true" />
                    </span>
                    <span className={styles.megaText}>
                      <span className={styles.megaName}>{p.name}</span>
                      <span className={styles.megaPrice}>
                        vanaf <b>{formatCurrency(p.priceFrom, catalog)}</b>
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className={styles.megaFoot}>
              <Link
                href="/collectie"
                className={styles.megaAll}
                onClick={() => setMega(false)}
              >
                Bekijk de hele collectie <ArrowRight size={16} />
              </Link>
            </div>
          </Container>
        </div>
      )}

      {open && (
        <div id="mobile-menu" className={styles.overlay}>
          <Container className={styles.overlayInner} as="div">
            <div className={styles.overlayTop}>
              <span className={styles.kicker}>Menu</span>
              <button
                type="button"
                className={styles.overlayClose}
                aria-label="Menu sluiten"
                onClick={() => setOpen(false)}
              >
                <Close size={26} />
              </button>
            </div>

            <nav className={styles.overlayNav} aria-label="Mobiele navigatie">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.overlayLink}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className={styles.overlayFoot}>
              <Link
                href="/winkelwagen"
                className={styles.overlayAction}
                onClick={() => setOpen(false)}
              >
                Winkelmand <Bag size={18} />
              </Link>
              <Link
                href="/contact"
                className={styles.overlayAction}
                onClick={() => setOpen(false)}
              >
                Offerte aanvragen <ArrowRight size={18} />
              </Link>
              <p className={styles.overlayNote}>
                Sign Company B.V. — biologisch afbreekbare vlaggen, CSRD-proof
                geleverd binnen 5 werkdagen.
              </p>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
