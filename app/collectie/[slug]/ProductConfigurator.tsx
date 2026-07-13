"use client";

/**
 * Interactive product configuration island: size + options + quantity, a live
 * (indicative) price, and the add-to-cart / request-quote CTAs.
 *
 * The product is currently quote-only (`orderable === false`) because its Probo
 * code is not confirmed yet — the primary CTA then points at the quote flow and
 * the cart line is stored as a quote request (`proboProductCode: null`). When a
 * product becomes orderable the same UI drives a real cart line.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./product.module.css";
import { Badge, Button, Check, ArrowRight, Leaf } from "@/components/ui";
import { useCart } from "@/components/cart/CartProvider";
import { formatCurrency } from "@/lib/i18n/formatting";
import type { UiCatalog } from "@/config/domains";
import type { CatalogProduct } from "@/lib/catalog/products";

export interface ConfiguratorLabels {
  size: string;
  quantity: string;
  priceLabel: string;
  priceNote: string;
  exclVat: string;
  addToCart: string;
  requestQuote: string;
  added: string;
  viewCart: string;
  noticeQuoteOnly: string;
}

export function ProductConfigurator({
  product,
  orderable,
  catalog,
  labels,
}: {
  product: CatalogProduct;
  orderable: boolean;
  catalog: UiCatalog;
  labels: ConfiguratorLabels;
}) {
  const { addItem } = useCart();

  const [sizeIndex, setSizeIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        product.options.map((opt) => [opt.label, opt.choices[0]]),
      ),
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const size = product.sizes[sizeIndex];
  const estimate = useMemo(
    () => product.priceFrom * quantity,
    [product.priceFrom, quantity],
  );

  function handleAdd() {
    addItem({
      slug: product.slug,
      name: product.name,
      proboProductCode: product.proboProductCode,
      sizeLabel: size.label,
      unitPriceEstimate: product.priceFrom,
      amount: quantity,
      options: [
        { code: "Formaat", value: size.label },
        ...product.options.map((opt) => ({
          code: opt.label,
          value: selectedOptions[opt.label],
        })),
      ],
    });
    setAdded(true);
  }

  return (
    <div className={styles.configurator}>
      {!orderable && (
        <p className={styles.notice}>
          <span className={styles.noticeIcon} aria-hidden="true">
            <Leaf size={18} />
          </span>
          {labels.noticeQuoteOnly}
        </p>
      )}

      {/* Size choice */}
      <fieldset className={styles.fieldGroup}>
        <legend className={styles.fieldLabel}>{labels.size}</legend>
        <div className={styles.choices}>
          {product.sizes.map((s, i) => (
            <label key={s.label} className={styles.choice}>
              <input
                type="radio"
                name="size"
                checked={sizeIndex === i}
                onChange={() => {
                  setSizeIndex(i);
                  setAdded(false);
                }}
              />
              <span className={styles.choicePill}>{s.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Options */}
      {product.options.map((opt) => (
        <fieldset key={opt.label} className={styles.fieldGroup}>
          <legend className={styles.fieldLabel}>{opt.label}</legend>
          <div className={styles.choices}>
            {opt.choices.map((choice) => (
              <label key={choice} className={styles.choice}>
                <input
                  type="radio"
                  name={opt.label}
                  checked={selectedOptions[opt.label] === choice}
                  onChange={() => {
                    setSelectedOptions((prev) => ({
                      ...prev,
                      [opt.label]: choice,
                    }));
                    setAdded(false);
                  }}
                />
                <span className={styles.choicePill}>{choice}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      {/* Quantity */}
      <fieldset className={styles.fieldGroup}>
        <legend className={styles.fieldLabel}>{labels.quantity}</legend>
        <div className={styles.quantity}>
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => {
              setQuantity((q) => Math.max(1, q - 1));
              setAdded(false);
            }}
            disabled={quantity <= 1}
            aria-label="Aantal verlagen"
          >
            −
          </button>
          <input
            type="number"
            className={styles.qtyInput}
            min={1}
            value={quantity}
            aria-label={labels.quantity}
            onChange={(e) => {
              const next = Number(e.target.value);
              setQuantity(Number.isFinite(next) && next >= 1 ? Math.floor(next) : 1);
              setAdded(false);
            }}
          />
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => {
              setQuantity((q) => q + 1);
              setAdded(false);
            }}
            aria-label="Aantal verhogen"
          >
            +
          </button>
        </div>
      </fieldset>

      {/* Live price */}
      <div className={styles.priceBlock}>
        <span className={styles.priceLabel}>{labels.priceLabel}</span>
        <span className={styles.priceValue}>
          {formatCurrency(estimate, catalog)}
        </span>
        <span className={styles.priceNote}>
          {labels.exclVat} · {labels.priceNote}
        </span>
      </div>

      {/* CTAs */}
      <div className={styles.actions}>
        {orderable ? (
          <Button size="lg" onClick={handleAdd} icon={<ArrowRight />}>
            {labels.addToCart}
          </Button>
        ) : (
          <>
            <Button
              as="a"
              href={`/contact?product=${product.slug}`}
              size="lg"
              icon={<ArrowRight />}
            >
              {labels.requestQuote}
            </Button>
            <Button variant="secondary" size="lg" onClick={handleAdd}>
              {labels.addToCart}
            </Button>
          </>
        )}
      </div>

      {added && (
        <p className={styles.added} role="status">
          <Badge variant="success" icon={<Check size={14} />}>
            {labels.added}
          </Badge>
          <Link href="/winkelwagen">{labels.viewCart}</Link>
        </p>
      )}
    </div>
  );
}
