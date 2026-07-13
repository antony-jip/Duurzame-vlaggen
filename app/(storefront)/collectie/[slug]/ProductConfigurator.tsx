"use client";

/**
 * Interactive product configuration island: size + options + quantity, a LIVE
 * price, and the add-to-cart / request-quote CTAs.
 *
 * When the product is orderable (`orderable === true`, i.e. its Probo mapping is
 * confirmed) the buy-bar shows the real Probo price — fetched via the
 * {@link getLivePrice} server action on every change (debounced, race-guarded) —
 * and "In winkelmand" is the primary CTA with "Offerte aanvragen" secondary. On
 * a Probo hiccup, or for a quote-only product, it falls back to the indicative
 * "vanaf" price (labelled "indicatie") and the quote flow leads.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./product.module.css";
import { Badge, Button, Check, ArrowRight, Leaf } from "@/components/ui";
import { useCart } from "@/components/cart/CartProvider";
import { formatCurrency } from "@/lib/i18n/formatting";
import type { UiCatalog } from "@/config/domains";
import type { CatalogProduct } from "@/lib/catalog/products";
import { getLivePrice } from "./price-action";

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
  /** Small hint shown while a live price is being fetched. */
  priceLoading: string;
}

type Pricing =
  | { status: "idle" | "loading" | "error" }
  | { status: "ok"; lineTotal: number; unitPrice: number };

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
  const [pricing, setPricing] = useState<Pricing>({ status: "idle" });

  const size = product.sizes[sizeIndex];

  // Indicative fallback: catalogue "vanaf" price × quantity.
  const estimate = useMemo(
    () => product.priceFrom * quantity,
    [product.priceFrom, quantity],
  );

  // Live price — debounced, race-guarded. Only for orderable products with a
  // real size (width/height). A stale response never overwrites a newer one.
  const reqRef = useRef(0);
  useEffect(() => {
    if (!orderable || size.widthCm == null || size.heightCm == null) {
      setPricing({ status: "idle" });
      return;
    }
    const reqId = ++reqRef.current;
    setPricing({ status: "loading" });
    const handle = setTimeout(() => {
      getLivePrice({
        slug: product.slug,
        widthCm: size.widthCm!,
        heightCm: size.heightCm!,
        amount: quantity,
        selections: selectedOptions,
      })
        .then((res) => {
          if (reqId !== reqRef.current) return; // superseded
          if (res.ok && res.lineTotal != null && res.unitPrice != null) {
            setPricing({
              status: "ok",
              lineTotal: res.lineTotal,
              unitPrice: res.unitPrice,
            });
          } else {
            setPricing({ status: "error" });
          }
        })
        .catch(() => {
          if (reqId === reqRef.current) setPricing({ status: "error" });
        });
    }, 300);
    return () => clearTimeout(handle);
  }, [orderable, product.slug, size.widthCm, size.heightCm, quantity, selectedOptions]);

  const priceLive = pricing.status === "ok";
  const displayPrice = priceLive ? pricing.lineTotal : estimate;
  // "indicatie" note only when we are NOT showing a confirmed live price.
  const showIndicatie = !priceLive;

  function handleAdd() {
    addItem({
      slug: product.slug,
      name: product.name,
      proboProductCode: product.proboProductCode,
      sizeLabel: size.label,
      widthCm: size.widthCm,
      heightCm: size.heightCm,
      // Store the live per-unit price when we have one, else the indicative.
      unitPriceEstimate: priceLive ? pricing.unitPrice : product.priceFrom,
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
    <div className={styles.configurator} data-accent={product.accent}>
      {!orderable && (
        <p className={styles.notice}>
          <span className={styles.noticeIcon} aria-hidden="true">
            <Leaf size={18} />
          </span>
          {labels.noticeQuoteOnly}
        </p>
      )}

      <div className={styles.groups}>
        {/* Size choice */}
        <fieldset className={styles.group}>
          <legend className={styles.groupLabel}>
            <span>{labels.size}</span>
            <span className={styles.groupValue}>{size.label}</span>
          </legend>
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
          <fieldset key={opt.label} className={styles.group}>
            <legend className={styles.groupLabel}>
              <span>{opt.label}</span>
              <span className={styles.groupValue}>
                {selectedOptions[opt.label]}
              </span>
            </legend>
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
        <fieldset className={styles.group}>
          <legend className={styles.groupLabel}>
            <span>{labels.quantity}</span>
          </legend>
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
                setQuantity(
                  Number.isFinite(next) && next >= 1 ? Math.floor(next) : 1,
                );
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
      </div>

      {/* Sticky buy bar — live price + CTAs, stays in view while configuring */}
      <div className={styles.buyBar}>
        <div className={styles.priceBlock}>
          <span className={styles.priceLabel}>{labels.priceLabel}</span>
          <span
            className={styles.priceValue}
            aria-busy={pricing.status === "loading" || undefined}
          >
            {formatCurrency(displayPrice, catalog)}
          </span>
          <span className={styles.priceNote}>
            {pricing.status === "loading"
              ? labels.priceLoading
              : showIndicatie
                ? `${labels.exclVat} · ${labels.priceNote}`
                : labels.exclVat}
          </span>
        </div>

        <div className={styles.actions}>
          {orderable ? (
            <>
              <Button size="lg" onClick={handleAdd} icon={<ArrowRight />}>
                {labels.addToCart}
              </Button>
              <Link
                href={`/contact?product=${product.slug}`}
                className={styles.quoteLink}
              >
                {labels.requestQuote}
              </Link>
            </>
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
