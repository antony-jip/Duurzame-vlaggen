"use client";

/**
 * Segmented control in de topbar waarmee de bezoeker alle prijzen op de site
 * wisselt tussen ex en incl btw. De voorkeur leeft in de CartProvider en wordt
 * persistent bewaard, zodat elk <Price> mee verspringt.
 */

import { useCart } from "@/components/cart/CartProvider";
import styles from "./VatToggle.module.css";

export function VatToggle() {
  const { inclVat, toggleVat } = useCart();
  return (
    <div
      className={styles.toggle}
      role="group"
      aria-label="Prijzen tonen ex of incl. btw"
    >
      <button
        type="button"
        className={styles.opt}
        data-active={!inclVat}
        aria-pressed={!inclVat}
        onClick={() => {
          if (inclVat) toggleVat();
        }}
      >
        Ex. btw
      </button>
      <button
        type="button"
        className={styles.opt}
        data-active={inclVat}
        aria-pressed={inclVat}
        onClick={() => {
          if (!inclVat) toggleVat();
        }}
      >
        Incl. btw
      </button>
    </div>
  );
}
