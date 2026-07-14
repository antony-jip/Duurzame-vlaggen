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
  localCartLineTotal,
  localCustomSizePrice,
} from "@/lib/pricing/local-catalog";

/** Redelijke grenzen (cm) voor een eigen maat. */
const CUSTOM_MIN_CM = 20;
const CUSTOM_MAX_CM = 600;

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
 * Generiek beeld per (optielabel → keuze), gedeeld tussen producten. Waar geen
 * zinnig beeld bestaat, valt de kaart terug op een kleur-swatch of nette
 * tekstkaart. Bestanden staan in `public/configurator/`.
 */
const OPTION_IMAGES: Record<string, Record<string, string>> = {
  Mastzijde: {
    // Gevelvlag/beachvlag: neutrale mastzijde-beelden.
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
};

/**
 * Product-specifieke beeld-overrides (winnen van de generieke map).
 * Per productslug → optielabel → keuze. Zo krijgt de baniervlag zijn eigen
 * mastzijde-/afwerking-/bandkleur-beelden zonder gevelvlag/beachvlag te breken.
 */
const PRODUCT_OPTION_IMAGES: Record<
  string,
  Record<string, Record<string, string>>
> = {
  baniervlag: {
    Mastzijde: {
      Links: "/configurator/mastzijde/banier-links.webp",
      Rechts: "/configurator/mastzijde/banier-rechts.webp",
    },
    Afwerking: {
      Tunnel: "/configurator/afwerking/tunnel.webp",
      Geen: "/configurator/afwerking/geen.webp",
    },
    Kleur: {
      Wit: "/configurator/kleur/band-wit.webp",
      Zwart: "/configurator/kleur/band-zwart.webp",
    },
  },
};

/** Beeld voor een optie-keuze: eerst de product-override, dan de generieke map. */
function optionImage(
  slug: string,
  label: string,
  choice: string,
): string | undefined {
  return (
    PRODUCT_OPTION_IMAGES[slug]?.[label]?.[choice] ??
    OPTION_IMAGES[label]?.[choice]
  );
}

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

  // Eigen-maat-modus: vrije breedte × hoogte in cm.
  const [customMode, setCustomMode] = useState(false);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");

  const presetSize = product.sizes[sizeIndex];

  // Eigen maat valideren: positieve getallen binnen redelijke grenzen.
  const wNum = Number(customW);
  const hNum = Number(customH);
  const customValid =
    customW.trim() !== "" &&
    customH.trim() !== "" &&
    Number.isFinite(wNum) &&
    Number.isFinite(hNum) &&
    wNum >= CUSTOM_MIN_CM &&
    wNum <= CUSTOM_MAX_CM &&
    hNum >= CUSTOM_MIN_CM &&
    hNum <= CUSTOM_MAX_CM;
  const usingCustom = customMode && customValid;

  // Effectieve maat = eigen maat (indien geldig) of de gekozen preset.
  const size = usingCustom
    ? {
        label: `Eigen: ${wNum} × ${hNum} cm`,
        widthCm: wNum,
        heightCm: hNum,
      }
    : presetSize;

  // In eigen-maat-modus zonder geldige invoer: geen prijs, geen add-to-cart.
  const priceReady = !customMode || customValid;

  // Instant, netwerk-loze berekening uit het eigen lokale prijsmodel.
  const optionsSurcharge = localOptionsSurcharge(product, selectedOptions);
  const unitBasis = usingCustom
    ? Math.round((localCustomSizePrice(product, wNum, hNum) + optionsSurcharge) * 100) / 100
    : localUnitPriceWithOptions(product, presetSize, selectedOptions);
  const discount = staffelDiscount(quantity);
  const lineExVat = localCartLineTotal(unitBasis, quantity);
  const designExVat = designServiceCost(designService);
  const totalExVat = Math.round((lineExVat + designExVat) * 100) / 100;
  const savings = Math.round((unitBasis * quantity - lineExVat) * 100) / 100;

  /** Toon een ex-btw bedrag volgens de globale btw-voorkeur. */
  const show = (amount: number) => (inclVat ? amount * (1 + VAT_RATE) : amount);
  const fmt = (amount: number) => formatCurrency(show(amount), catalog);

  function handleAdd() {
    if (!priceReady) return;
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
            <span className={styles.groupValue}>
              {usingCustom
                ? size.label
                : customMode
                  ? "Eigen afmeting"
                  : presetSize.label}
            </span>
          </legend>
          <div className={styles.choices}>
            {product.sizes.map((s, i) => {
              const unit = localUnitPriceWithOptions(product, s, selectedOptions);
              return (
                <label key={s.label} className={styles.choice}>
                  <input
                    type="radio"
                    name="size"
                    checked={!customMode && sizeIndex === i}
                    onChange={() => {
                      setSizeIndex(i);
                      setCustomMode(false);
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

          {/* Eigen afmeting — vrije breedte × hoogte */}
          <div className={styles.customSize}>
            <button
              type="button"
              className={styles.customSizeToggle}
              data-on={customMode}
              aria-expanded={customMode}
              onClick={() => {
                setCustomMode((v) => !v);
                setAdded(false);
              }}
            >
              <span>Eigen afmeting invoeren?</span>
              <span className={styles.customSizeToggleIcon} aria-hidden="true">
                {customMode ? "−" : "+"}
              </span>
            </button>

            {customMode && (
              <div className={styles.customSizePanel}>
                <p className={styles.customSizeHint}>
                  Vul je gewenste breedte en hoogte in centimeters in. We rekenen
                  de prijs per m² en bevestigen de definitieve maatvoering bij je
                  order.
                </p>
                <div className={styles.customSizeFields}>
                  <label className={styles.customSizeField}>
                    <span className={styles.customSizeFieldLabel}>Breedte (cm)</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      className={styles.customSizeInput}
                      min={CUSTOM_MIN_CM}
                      max={CUSTOM_MAX_CM}
                      value={customW}
                      placeholder="bv. 100"
                      onChange={(e) => {
                        setCustomW(e.target.value);
                        setAdded(false);
                      }}
                    />
                  </label>
                  <span className={styles.customSizeTimes} aria-hidden="true">
                    ×
                  </span>
                  <label className={styles.customSizeField}>
                    <span className={styles.customSizeFieldLabel}>Hoogte (cm)</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      className={styles.customSizeInput}
                      min={CUSTOM_MIN_CM}
                      max={CUSTOM_MAX_CM}
                      value={customH}
                      placeholder="bv. 250"
                      onChange={(e) => {
                        setCustomH(e.target.value);
                        setAdded(false);
                      }}
                    />
                  </label>
                </div>
                {!customValid && (customW.trim() !== "" || customH.trim() !== "") && (
                  <p className={styles.customSizeError} role="alert">
                    Vul een breedte en hoogte tussen {CUSTOM_MIN_CM} en{" "}
                    {CUSTOM_MAX_CM} cm in.
                  </p>
                )}
              </div>
            )}
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
                const imgSrc = optionImage(product.slug, opt.label, choice);
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
          <span className={styles.priceValue}>
            {priceReady ? fmt(totalExVat) : "—"}
          </span>
          <span className={styles.priceNote}>
            {priceReady
              ? `${inclVat ? "incl. btw" : "excl. btw"}${
                  designService ? ` · incl. ontwerpservice` : ""
                }${usingCustom ? " · eigen maat" : ""} · Richtprijs · definitieve prijs bij afrekenen`
              : "Vul eerst een geldige eigen afmeting in"}
          </span>
        </div>

        <div className={styles.actions}>
          {orderable ? (
            <>
              <Button
                size="lg"
                onClick={handleAdd}
                icon={<ArrowRight />}
                disabled={!priceReady}
              >
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
              <Button
                variant="secondary"
                size="lg"
                onClick={handleAdd}
                disabled={!priceReady}
              >
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
