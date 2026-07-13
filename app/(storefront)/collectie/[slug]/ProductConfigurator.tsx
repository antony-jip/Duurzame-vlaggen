"use client";

/**
 * Rijke product-configurator: maat + staffelkorting + geïllustreerde
 * optie-beeldkaarten + ontwerpservice, met een INSTANT prijs en add-to-cart.
 *
 * De prijs komt uit het EIGEN lokale prijsmodel (`@/lib/pricing/local-catalog`):
 * geen debounce, geen loading-spinner, geen netwerk-call. Voor een orderbaar
 * product (`orderable === true`) leidt "In winkelmand"; bij een quote-only
 * product (bv. vlaggenmast) leidt de offerte-flow.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./product.module.css";
import { Badge, Button, Check, ArrowRight, Leaf } from "@/components/ui";
import { useCart, VAT_RATE } from "@/components/cart/CartProvider";
import { formatCurrency } from "@/lib/i18n/formatting";
import type { UiCatalog } from "@/config/domains";
import type { CatalogProduct } from "@/lib/catalog/products";
import {
  STAFFEL_TIERS,
  staffelDiscount,
  designServiceCost,
  DESIGN_SERVICE_PRICE,
  localOptionsSurcharge,
  localUnitPriceWithOptions,
  localLinePrice,
} from "@/lib/pricing/local-catalog";

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

/**
 * Beeld per (optielabel → keuze). Waar geen zinnig beeld bestaat, valt de kaart
 * terug op een kleur-swatch of nette tekstkaart. Bestanden staan in
 * `public/configurator/`.
 */
const OPTION_IMAGES: Record<string, Record<string, string>> = {
  Mastzijde: {
    Links: "/configurator/mastzijde/links.webp",
    Rechts: "/configurator/mastzijde/rechts.webp",
  },
  Kleur: {
    Wit: "/configurator/kleur/wit.png",
    Zwart: "/configurator/kleur/zwart.png",
  },
  "Band- en koordkleur": {
    Wit: "/configurator/kleur/wit.png",
    Zwart: "/configurator/kleur/zwart.png",
  },
  Afwerking: {
    "Zoom met ringen": "/configurator/afwerking/ringen.webp",
  },
  Bevestiging: {
    Karabijnhaken: "/configurator/afwerking/haken.jpeg",
    Spankoord: "/configurator/afwerking/koord-lus.jpeg",
  },
};

/** Kleur-swatches voor keuzes zonder foto (bv. Aluminium, Antraciet). */
const COLOR_SWATCHES: Record<string, string> = {
  Wit: "#f4f4f2",
  Zwart: "#1c1c1c",
  Aluminium: "linear-gradient(135deg, #dcdfe1 0%, #a9adb0 100%)",
  Antraciet: "#3a3d40",
};

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
  const { addItem, inclVat } = useCart();

  const [sizeIndex, setSizeIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        product.options.map((opt) => [opt.label, opt.choices[0]]),
      ),
  );
  const [quantity, setQuantity] = useState(1);
  const [designService, setDesignService] = useState(false);
  const [added, setAdded] = useState(false);

  const size = product.sizes[sizeIndex];

  // Instant, netwerk-loze berekening uit het eigen lokale prijsmodel.
  const unitBasis = localUnitPriceWithOptions(product, size, selectedOptions);
  const discount = staffelDiscount(quantity);
  const lineExVat = localLinePrice({
    product,
    size,
    amount: quantity,
    selections: selectedOptions,
  });
  const designExVat = designServiceCost(designService);
  const totalExVat = Math.round((lineExVat + designExVat) * 100) / 100;
  const savings = Math.round((unitBasis * quantity - lineExVat) * 100) / 100;

  /** Toon een ex-btw bedrag volgens de globale btw-voorkeur. */
  const show = (amount: number) => (inclVat ? amount * (1 + VAT_RATE) : amount);
  const fmt = (amount: number) => formatCurrency(show(amount), catalog);

  function handleAdd() {
    const baseOptions = [
      { code: "Formaat", value: size.label },
      ...product.options.map((opt) => ({
        code: opt.label,
        value: selectedOptions[opt.label],
      })),
    ];
    addItem({
      slug: product.slug,
      name: product.name,
      proboProductCode: product.proboProductCode,
      sizeLabel: size.label,
      widthCm: size.widthCm,
      heightCm: size.heightCm,
      // Ex-btw stukprijs incl. gekozen opties = de staffel-basis.
      unitPriceEstimate: unitBasis,
      amount: quantity,
      options: designService
        ? [...baseOptions, { code: "Ontwerpservice", value: `Ja (+${formatCurrency(DESIGN_SERVICE_PRICE, catalog)})` }]
        : baseOptions,
    });
    setAdded(true);
  }

  // Actieve staffel-tier = hoogste tier waarvan het aantal ≥ tier.qty.
  const activeTierQty = STAFFEL_TIERS.reduce(
    (acc, t) => (quantity >= t.qty ? t.qty : acc),
    STAFFEL_TIERS[0].qty,
  );

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
        {/* Formaat — keuzepillen met stukprijs per maat */}
        <fieldset className={styles.group}>
          <legend className={styles.groupLabel}>
            <span>{labels.size}</span>
            <span className={styles.groupValue}>{size.label}</span>
          </legend>
          <div className={styles.choices}>
            {product.sizes.map((s, i) => {
              const unit = localUnitPriceWithOptions(product, s, selectedOptions);
              return (
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
                  <span className={styles.sizePill}>
                    <span className={styles.sizePillLabel}>{s.label}</span>
                    <span className={styles.sizePillPrice}>{fmt(unit)}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Staffelkorting — klikbare tier-kaarten + eigen aantal */}
        <fieldset className={styles.group}>
          <legend className={styles.groupLabel}>
            <span>Aantal &amp; staffelkorting</span>
            {discount > 0 && (
              <span className={styles.groupValue}>
                −{Math.round(discount * 100)}%
              </span>
            )}
          </legend>

          <div className={styles.staffelGrid}>
            {STAFFEL_TIERS.map((tier) => {
              const perUnit = unitBasis * (1 - tier.discount);
              const active = activeTierQty === tier.qty;
              return (
                <button
                  key={tier.qty}
                  type="button"
                  className={styles.staffelCard}
                  data-active={active}
                  aria-pressed={active}
                  onClick={() => {
                    setQuantity(tier.qty);
                    setAdded(false);
                  }}
                >
                  {tier.popular && (
                    <span className={styles.staffelPopular}>Meest gekozen</span>
                  )}
                  <span className={styles.staffelQty}>
                    {tier.qty}
                    {tier.qty >= 50 ? "+" : ""} st
                  </span>
                  <span className={styles.staffelPer}>{fmt(perUnit)} p.s.</span>
                  <span className={styles.staffelDisc}>
                    {tier.discount > 0
                      ? `−${Math.round(tier.discount * 100)}%`
                      : "geen korting"}
                  </span>
                  {active && (
                    <span className={styles.staffelCheck} aria-hidden="true">
                      <Check size={13} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className={styles.customQtyRow}>
            <span className={styles.customQtyLabel}>{labels.quantity}</span>
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
            {savings > 0 && (
              <span className={styles.savings}>
                Je bespaart {fmt(savings)}
              </span>
            )}
          </div>
        </fieldset>

        {/* Opties als beeldkaarten */}
        {product.options.map((opt) => (
          <fieldset key={opt.label} className={styles.group}>
            <legend className={styles.groupLabel}>
              <span>{opt.label}</span>
              <span className={styles.groupValue}>
                {selectedOptions[opt.label]}
              </span>
            </legend>
            <div className={styles.optionCards}>
              {opt.choices.map((choice) => {
                const selected = selectedOptions[opt.label] === choice;
                const imgSrc = OPTION_IMAGES[opt.label]?.[choice];
                const swatch = COLOR_SWATCHES[choice];
                const surcharge = localOptionsSurcharge(product, {
                  [opt.label]: choice,
                });
                return (
                  <label key={choice} className={styles.optionCard}>
                    <input
                      type="radio"
                      name={opt.label}
                      checked={selected}
                      onChange={() => {
                        setSelectedOptions((prev) => ({
                          ...prev,
                          [opt.label]: choice,
                        }));
                        setAdded(false);
                      }}
                    />
                    <span className={styles.optionCardInner}>
                      <span className={styles.optionCardMedia}>
                        {imgSrc ? (
                          <Image
                            src={imgSrc}
                            alt={`${opt.label}: ${choice}`}
                            fill
                            sizes="(max-width: 860px) 40vw, 160px"
                            className={styles.optionCardImg}
                          />
                        ) : swatch ? (
                          <span
                            className={styles.optionCardSwatch}
                            style={{ background: swatch }}
                            aria-hidden="true"
                          />
                        ) : (
                          <span className={styles.optionCardFallback} aria-hidden="true">
                            {choice}
                          </span>
                        )}
                        <span className={styles.optionCardCheck} aria-hidden="true">
                          <Check size={14} />
                        </span>
                      </span>
                      <span className={styles.optionCardText}>
                        <span className={styles.optionCardLabel}>{choice}</span>
                        {surcharge > 0 && (
                          <span className={styles.optionCardSurcharge}>
                            +{fmt(surcharge)}
                          </span>
                        )}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        {/* Ontwerpservice-toggle */}
        <fieldset className={styles.group}>
          <legend className={styles.groupLabel}>
            <span>Ontwerpservice</span>
          </legend>
          <button
            type="button"
            className={styles.designToggle}
            role="switch"
            aria-checked={designService}
            data-on={designService}
            onClick={() => {
              setDesignService((v) => !v);
              setAdded(false);
            }}
          >
            <span className={styles.designText}>
              <span className={styles.designTitle}>Laat je vlag door ons ontwerpen</span>
              <span className={styles.designSub}>
                Vast bedrag · {fmt(DESIGN_SERVICE_PRICE)} · eenmalig per order
              </span>
            </span>
            <span className={styles.designSwitch} aria-hidden="true">
              <span className={styles.designKnob} />
            </span>
          </button>
        </fieldset>
      </div>

      {/* Sticky buy bar — live price + CTAs, stays in view while configuring */}
      <div className={styles.buyBar}>
        <div className={styles.priceBlock}>
          <span className={styles.priceLabel}>{labels.priceLabel}</span>
          <span className={styles.priceValue}>{fmt(totalExVat)}</span>
          <span className={styles.priceNote}>
            {`${inclVat ? "incl. btw" : "excl. btw"}${
              designService ? ` · incl. ontwerpservice` : ""
            } · Richtprijs · definitieve prijs bij afrekenen`}
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
