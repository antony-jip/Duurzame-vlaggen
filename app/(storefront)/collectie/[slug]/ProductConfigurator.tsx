"use client";

/**
 * Product-configurator — rustige, stapsgewijze flow met een INSTANT prijs.
 *
 * Herontwerp (2026-07): weg met de lompe grote foto-optiekaarten en het
 * dominante 5-kaarts staffelblok. In de plaats:
 *  - genummerde stappen (formaat → afwerking → aantal) met lichte hiërarchie,
 *  - een scanbare formaatlijst met mini-vormvoorbeeld + "Meest gekozen",
 *  - compacte segmented controls met kleine SVG-glyphs voor de opties,
 *  - een rustige aantal-stepper met bulkkorting als subtiele, uitklapbare strip.
 *
 * De prijs komt onveranderd uit het EIGEN lokale prijsmodel
 * (`@/lib/pricing/local-catalog`): geen debounce, geen netwerk-call.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./product.module.css";
import { Badge, Button, Check, ArrowRight, Leaf, Truck, ShieldCheck } from "@/components/ui";
import { useCart, VAT_RATE } from "@/components/cart/CartProvider";
import { formatCurrency } from "@/lib/i18n/formatting";
import type { UiCatalog } from "@/config/domains";
import type { CatalogProduct, CatalogSize } from "@/lib/catalog/products";
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

/** Kleur-swatches voor kleur-keuzes zonder eigen beeld (bv. Aluminium). */
const COLOR_SWATCHES: Record<string, string> = {
  Wit: "#f4f4f2",
  Zwart: "#1c1c1c",
  Aluminium: "linear-gradient(135deg, #dcdfe1 0%, #a9adb0 100%)",
  Antraciet: "#3a3d40",
};

/**
 * Generiek beeld per (optielabel → keuze), gedeeld tussen producten. Waar geen
 * beeld bestaat, valt de kaart terug op een kleur-swatch of tekstkaart.
 * Bestanden staan in `public/configurator/`.
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
};

/**
 * Product-specifieke beeld-overrides (winnen van de generieke map): per
 * productslug → optielabel → keuze. Zo krijgt de baniervlag zijn eigen
 * mastzijde-/afwerking-/bandkleur-beelden.
 */
const PRODUCT_OPTION_IMAGES: Record<
  string,
  Record<string, Record<string, string>>
> = {
  baniervlag: {
    Mastzijde: {
      // Staande banier op mast (huisstijl-SVG). Vervang gerust door een eigen
      // render door hier een .webp/.png op hetzelfde pad te plaatsen.
      Links: "/configurator/mastzijde/banier-links.svg",
      Rechts: "/configurator/mastzijde/banier-rechts.svg",
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
function optionImage(slug: string, label: string, choice: string): string | undefined {
  return (
    PRODUCT_OPTION_IMAGES[slug]?.[label]?.[choice] ?? OPTION_IMAGES[label]?.[choice]
  );
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
  const { addItem, inclVat } = useCart();

  // Standaard-formaat = de "Meest gekozen" maat als die bestaat, anders de eerste.
  const defaultSizeIndex = Math.max(
    0,
    product.sizes.findIndex((s) => s.popular),
  );
  const portrait = isPortrait(product.sizes[defaultSizeIndex] ?? product.sizes[0]);

  const [sizeIndex, setSizeIndex] = useState(defaultSizeIndex);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        product.options.map((opt) => [opt.label, opt.choices[0]]),
      ),
  );
  const [quantity, setQuantity] = useState(1);
  const [designService, setDesignService] = useState(false);
  const [showStaffel, setShowStaffel] = useState(false);
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
  const nextTier = STAFFEL_TIERS.find((t) => t.qty > quantity);

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

      <div className={styles.steps}>
        {/* Stap 1 — Formaat */}
        <section className={styles.step}>
          <header className={styles.stepHead}>
            <span className={styles.stepDot}>1</span>
            <span className={styles.stepTitle}>{labels.size}</span>
            <span className={styles.stepPick}>
              {usingCustom ? size.label : customMode ? "Eigen afmeting" : presetSize.label}
            </span>
          </header>

          <div className={styles.sizeList} role="radiogroup" aria-label={labels.size}>
            {product.sizes.map((s, i) => {
              const unit = localUnitPriceWithOptions(product, s, selectedOptions);
              const selected = !customMode && sizeIndex === i;
              return (
                <label key={s.label} className={styles.sizeRow} data-selected={selected}>
                  <input
                    type="radio"
                    name="size"
                    checked={selected}
                    onChange={() => {
                      setSizeIndex(i);
                      setCustomMode(false);
                      setAdded(false);
                    }}
                  />
                  <span className={styles.sizeShape} aria-hidden="true">
                    <span
                      className={styles.sizeShapeInner}
                      style={sizeShapeStyle(s)}
                    />
                  </span>
                  <span className={styles.sizeMeta}>
                    <span className={styles.sizeLabel}>
                      {s.label}
                      {s.popular && (
                        <span className={styles.sizePopular}>Meest gekozen</span>
                      )}
                    </span>
                    <span className={styles.sizeSub}>
                      {portrait ? "Staand" : "Liggend"}
                    </span>
                  </span>
                  <span className={styles.sizePrice}>{fmt(unit)}</span>
                  <span className={styles.sizeTick} aria-hidden="true">
                    <Check size={14} />
                  </span>
                </label>
              );
            })}
          </div>

          {/* Eigen afmeting — vrije breedte × hoogte */}
          <button
            type="button"
            className={styles.customToggle}
            data-on={customMode}
            aria-expanded={customMode}
            onClick={() => {
              setCustomMode((v) => !v);
              setAdded(false);
            }}
          >
            <span className={styles.customToggleIcon} aria-hidden="true">
              {customMode ? "−" : "+"}
            </span>
            <span>Eigen afmeting invoeren</span>
          </button>

          {customMode && (
            <div className={styles.customPanel}>
              <p className={styles.customHint}>
                Vul je gewenste breedte en hoogte in centimeters in. We rekenen de
                prijs per m² en bevestigen de definitieve maatvoering bij je order.
              </p>
              <div className={styles.customFields}>
                <label className={styles.customField}>
                  <span className={styles.customFieldLabel}>Breedte (cm)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className={styles.customInput}
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
                <span className={styles.customTimes} aria-hidden="true">×</span>
                <label className={styles.customField}>
                  <span className={styles.customFieldLabel}>Hoogte (cm)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className={styles.customInput}
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
                <p className={styles.customError} role="alert">
                  Vul een breedte en hoogte tussen {CUSTOM_MIN_CM} en {CUSTOM_MAX_CM} cm in.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Stap 2 — Afwerking & opties */}
        {product.options.length > 0 && (
          <section className={styles.step}>
            <header className={styles.stepHead}>
              <span className={styles.stepDot}>2</span>
              <span className={styles.stepTitle}>Afwerking</span>
            </header>

            <div className={styles.optionList}>
              {product.options.map((opt) => (
                <div key={opt.label} className={styles.optionRow}>
                  <span className={styles.optionRowLabel}>
                    {opt.label}
                    <span className={styles.optionRowPick}>{selectedOptions[opt.label]}</span>
                  </span>
                  <div className={styles.optionGrid} role="radiogroup" aria-label={opt.label}>
                    {opt.choices.map((choice) => {
                      const selected = selectedOptions[opt.label] === choice;
                      const imgSrc = optionImage(product.slug, opt.label, choice);
                      const swatch = COLOR_SWATCHES[choice];
                      const surcharge = localOptionsSurcharge(product, {
                        [opt.label]: choice,
                      });
                      return (
                        <label key={choice} className={styles.optionCard} data-selected={selected}>
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
                          <span className={styles.optionCardMedia}>
                            {imgSrc ? (
                              <Image
                                src={imgSrc}
                                alt={`${opt.label}: ${choice}`}
                                fill
                                sizes="(max-width: 860px) 45vw, 180px"
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
                          <span className={styles.optionCardFoot}>
                            <span className={styles.optionCardName}>{choice}</span>
                            {surcharge > 0 && (
                              <span className={styles.optionCardSurcharge}>+{fmt(surcharge)}</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stap 3 — Aantal + bulkkorting */}
        <section className={styles.step}>
          <header className={styles.stepHead}>
            <span className={styles.stepDot}>{product.options.length > 0 ? 3 : 2}</span>
            <span className={styles.stepTitle}>{labels.quantity}</span>
            {discount > 0 && (
              <span className={styles.stepPick}>−{Math.round(discount * 100)}% korting</span>
            )}
          </header>

          <div className={styles.qtyRow}>
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

            {savings > 0 ? (
              <span className={styles.savings}>Je bespaart {fmt(savings)}</span>
            ) : nextTier ? (
              <button
                type="button"
                className={styles.staffelNudge}
                onClick={() => {
                  setQuantity(nextTier.qty);
                  setAdded(false);
                }}
              >
                Neem er {nextTier.qty} → −{Math.round(nextTier.discount * 100)}%
              </button>
            ) : null}
          </div>

          {/* Bulkkorting — subtiele, uitklapbare strip i.p.v. een dominant blok. */}
          <button
            type="button"
            className={styles.staffelToggle}
            aria-expanded={showStaffel}
            onClick={() => setShowStaffel((v) => !v)}
          >
            <span>Staffelkorting bekijken</span>
            <span className={styles.staffelToggleIcon} data-on={showStaffel} aria-hidden="true">
              ⌄
            </span>
          </button>
          {showStaffel && (
            <div className={styles.staffelStrip}>
              {STAFFEL_TIERS.map((tier) => {
                const perUnit = unitBasis * (1 - tier.discount);
                const active = activeTierQty === tier.qty;
                return (
                  <button
                    key={tier.qty}
                    type="button"
                    className={styles.staffelCell}
                    data-active={active}
                    aria-pressed={active}
                    onClick={() => {
                      setQuantity(tier.qty);
                      setAdded(false);
                    }}
                  >
                    <span className={styles.staffelCellQty}>
                      {tier.qty}
                      {tier.qty >= 50 ? "+" : ""} st
                    </span>
                    <span className={styles.staffelCellPer}>{fmt(perUnit)}</span>
                    <span className={styles.staffelCellDisc}>
                      {tier.discount > 0 ? `−${Math.round(tier.discount * 100)}%` : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Ontwerpservice — lichte add-on */}
        <button
          type="button"
          className={styles.addon}
          role="switch"
          aria-checked={designService}
          data-on={designService}
          onClick={() => {
            setDesignService((v) => !v);
            setAdded(false);
          }}
        >
          <span className={styles.addonText}>
            <span className={styles.addonTitle}>Laat je vlag door ons ontwerpen</span>
            <span className={styles.addonSub}>
              Vast bedrag · {fmt(DESIGN_SERVICE_PRICE)} · eenmalig per order
            </span>
          </span>
          <span className={styles.addonSwitch} aria-hidden="true">
            <span className={styles.addonKnob} />
          </span>
        </button>
      </div>

      {/* Geruststelling vlak boven de CTA — de sterkste conversie-drivers. */}
      <ul className={styles.reassure}>
        <li>
          <Leaf size={15} aria-hidden="true" /> Biologisch afbreekbaar doek
        </li>
        <li>
          <Truck size={15} aria-hidden="true" /> Levering in ± 5 werkdagen
        </li>
        <li>
          <ShieldCheck size={15} aria-hidden="true" /> Veilig betalen via iDEAL
        </li>
      </ul>

      {/* Sticky buy bar — live price + CTA's */}
      <div className={styles.buyBar}>
        <div className={styles.priceBlock}>
          <span className={styles.priceLabel}>{labels.priceLabel}</span>
          <span className={styles.priceValue}>{priceReady ? fmt(totalExVat) : "—"}</span>
          <span className={styles.priceNote}>
            {priceReady
              ? `${inclVat ? "incl. btw" : "excl. btw"}${
                  designService ? " · incl. ontwerpservice" : ""
                }${usingCustom ? " · eigen maat" : ""} · richtprijs`
              : "Vul eerst een geldige eigen afmeting in"}
          </span>
        </div>

        <div className={styles.actions}>
          {orderable ? (
            <Button size="lg" onClick={handleAdd} icon={<ArrowRight />} disabled={!priceReady}>
              {labels.addToCart}
            </Button>
          ) : (
            <>
              <Button as="a" href={`/contact?product=${product.slug}`} size="lg" icon={<ArrowRight />}>
                {labels.requestQuote}
              </Button>
              <Button variant="secondary" size="lg" onClick={handleAdd} disabled={!priceReady}>
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

/** Staand als de hoogte groter is dan de breedte (of geen afmetingen bekend). */
function isPortrait(size?: CatalogSize): boolean {
  if (!size?.widthCm || !size?.heightCm) return true;
  return size.heightCm >= size.widthCm;
}

/**
 * Mini-vormvoorbeeld per maat: een proportioneel rechthoekje binnen een vast
 * kadertje, zodat je de verhouding (staand/liggend, hoe langgerekt) meteen ziet.
 */
function sizeShapeStyle(size: CatalogSize): React.CSSProperties {
  const w = size.widthCm ?? 1;
  const h = size.heightCm ?? 1;
  const max = 30; // px binnen het 34px-kadertje
  const ratio = w / h;
  if (ratio >= 1) {
    return { width: `${max}px`, height: `${Math.max(6, max / ratio)}px` };
  }
  return { width: `${Math.max(6, max * ratio)}px`, height: `${max}px` };
}
