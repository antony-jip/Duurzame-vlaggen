"use client";

/**
 * Bespoke Easylift-vlaggenmast-configurator.
 *
 * Rijker en anders dan de gewone `ProductConfigurator`: een levende mast-visual
 * die meegroeit met de lengte en meekleurt met de coating, een EIGEN mast-staffel
 * (5% vanaf 3 stuks — bewust anders dan de vlaggen-staffel) en een service-keuze
 * (zelf plaatsen vs montage) met een indicatief kostenmodel.
 *
 * Prijs komt volledig uit het lokale prijsmodel (`@/lib/pricing/local-catalog`):
 *  - basisprijs per lengte via `localUnitPrice` (HARDWARE_PRICES.vlaggenmast)
 *  - coating-meerprijs via `localOptionsSurcharge` (OPTION_SURCHARGES.vlaggenmast.Kleur)
 *  - mast-staffel + servicekosten worden hier LOKAAL gerekend (niet in de mand).
 *
 * De mast is quote-only (`proboProductCode: null`): "In winkelmand" zet een
 * schatting op de regel (mast + coating per stuk), en de bestaande checkout
 * routeert quote-only-regels naar de offerte-flow. Mast-staffel en servicekosten
 * worden in die offerte definitief verrekend.
 */

import { useState } from "react";
import Link from "next/link";
import styles from "./vlaggenmast.module.css";
import pstyles from "./product.module.css";
import { Badge, Button, Check, ArrowRight, Leaf, Truck, User } from "@/components/ui";
import { useCart, VAT_RATE } from "@/components/cart/CartProvider";
import { formatCurrency } from "@/lib/i18n/formatting";
import type { UiCatalog } from "@/config/domains";
import type { CatalogProduct } from "@/lib/catalog/products";
import {
  localUnitPrice,
  localOptionsSurcharge,
} from "@/lib/pricing/local-catalog";

/** Mast-staffel: 5% mastkorting vanaf 3 stuks (bewust anders dan de vlaggen-staffel). */
const MAST_STAFFEL_MIN = 3;
const MAST_STAFFEL_RATE = 0.05;

/** Servicekosten (ex btw) — indicatief kostenmodel uit de referentie. */
const LEVERING_EERSTE = 117; // 1e mast
const LEVERING_EXTRA = 19.5; // per extra mast
const MONTAGE_PER_MAST = 214.5; // per mast
const MONTAGE_VOORRIJDEN = 110.5; // eenmalig

type ServiceKeuze = "levering" | "montage";

/** Coating-swatch per kleurkeuze (visueel), los van de mast-gradient. */
const COATING_SWATCH: Record<string, string> = {
  Wit: "linear-gradient(135deg, #ffffff, #e4e6e7)",
  Aluminium: "linear-gradient(135deg, #dfe2e3, #a9adb0)",
  Zwart: "linear-gradient(135deg, #333333, #101010)",
  Antraciet: "linear-gradient(135deg, #4a4d50, #2b2e30)",
};

/** Meters uit een lengtelabel ("6 meter" → 6). */
function metersFromLabel(label: string): number {
  const n = parseInt(label, 10);
  return Number.isFinite(n) && n > 0 ? n : 6;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function VlaggenmastConfigurator({
  product,
  catalog,
}: {
  product: CatalogProduct;
  catalog: UiCatalog;
}) {
  const { addItem, inclVat } = useCart();

  const colorChoices = product.options[0]?.choices ?? ["Wit", "Aluminium", "Zwart", "Antraciet"];

  const [lengthIndex, setLengthIndex] = useState(0);
  const [color, setColor] = useState<string>(colorChoices[0]);
  const [quantity, setQuantity] = useState(1);
  const [service, setService] = useState<ServiceKeuze>("levering");
  const [added, setAdded] = useState(false);

  const size = product.sizes[lengthIndex];
  const meters = metersFromLabel(size.label);

  // --- Prijs (ex btw) ---
  const mastBasis = localUnitPrice(product, size); // basisprijs per lengte
  const coating = localOptionsSurcharge(product, { Kleur: color }); // coating-meerprijs
  const unitEx = round2(mastBasis + coating); // stukprijs mast + coating
  const hardwareSubtotal = round2(unitEx * quantity);
  const mastDiscountRate = quantity >= MAST_STAFFEL_MIN ? MAST_STAFFEL_RATE : 0;
  const mastDiscount = round2(hardwareSubtotal * mastDiscountRate);

  const leveringCost = round2(LEVERING_EERSTE + LEVERING_EXTRA * Math.max(0, quantity - 1));
  const montageCost = round2(MONTAGE_PER_MAST * quantity + MONTAGE_VOORRIJDEN);
  const serviceCost = service === "levering" ? leveringCost : montageCost;

  const totalEx = round2(hardwareSubtotal - mastDiscount + serviceCost);

  /** Toon een ex-btw bedrag volgens de globale btw-voorkeur. */
  const show = (amount: number) => (inclVat ? amount * (1 + VAT_RATE) : amount);
  const fmt = (amount: number) => formatCurrency(show(amount), catalog);
  const btwLabel = inclVat ? "incl. btw" : "excl. btw";

  const serviceLabel =
    service === "levering" ? "Levering (zelf plaatsen)" : "Montage-service";

  function handleAdd() {
    addItem({
      slug: product.slug,
      name: product.name,
      proboProductCode: null, // quote-only → offerte-flow
      sizeLabel: size.label, // de gekozen lengte, bv. "6 meter"
      // Ex-btw stukprijs = mast + coating. Servicekosten + mast-staffel worden
      // in de offerte verrekend, niet in de mand-schatting.
      unitPriceEstimate: unitEx,
      amount: quantity,
      options: [
        { code: "Lengte", value: size.label },
        { code: "Kleur & coating", value: color },
        { code: "Service", value: serviceLabel },
      ],
    });
    setAdded(true);
  }

  return (
    <div className={pstyles.configurator} data-accent={product.accent}>
      <p className={pstyles.notice}>
        <span className={pstyles.noticeIcon} aria-hidden="true">
          <Leaf size={18} />
        </span>
        Stel je Easylift-mast samen. De vlaggenmast leveren we op maat en offerte:
        voeg toe aan je winkelmand en je ontvangt een vrijblijvende offerte met de
        definitieve prijs en planning.
      </p>

      <div className={styles.wrap}>
        {/* ---- Levende mast-visual ---- */}
        <div className={styles.stage} aria-hidden="true">
          <span className={styles.lengthBadge}>{meters} meter</span>

          <span className={styles.mast} data-color={color} style={{ height: `${meters * 40}px` }}>
            <span className={styles.knob} />
            <span className={styles.flag} />
          </span>

          {/* Mens-op-schaal ±1,80 m (= 72px bij 40px/m). */}
          <span className={styles.person} style={{ height: "72px" }}>
            <span className={styles.personHead} />
            <span className={styles.personBody} />
          </span>
          <span className={styles.scaleTag}>± 1,80 m</span>

          <span className={styles.ground} />
        </div>

        {/* ---- Stappen ---- */}
        <div className={styles.steps}>
          {/* 1 — Lengte */}
          <fieldset className={pstyles.group}>
            <legend className={pstyles.groupLabel}>
              <span>
                <span className={styles.stepNo}>1</span>Lengte
              </span>
              <span className={pstyles.groupValue}>{size.label}</span>
            </legend>
            <div className={pstyles.choices}>
              {product.sizes.map((s, i) => {
                const unit = localUnitPrice(product, s) + coating;
                return (
                  <label key={s.label} className={pstyles.choice}>
                    <input
                      type="radio"
                      name="mast-lengte"
                      checked={lengthIndex === i}
                      onChange={() => {
                        setLengthIndex(i);
                        setAdded(false);
                      }}
                    />
                    <span className={pstyles.sizePill}>
                      <span className={pstyles.sizePillLabel}>{s.label}</span>
                      <span className={pstyles.sizePillPrice}>{fmt(round2(unit))}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* 2 — Kleur & coating */}
          <fieldset className={pstyles.group}>
            <legend className={pstyles.groupLabel}>
              <span>
                <span className={styles.stepNo}>2</span>Kleur &amp; coating
              </span>
              <span className={pstyles.groupValue}>{color}</span>
            </legend>
            <div className={styles.colorGrid}>
              {colorChoices.map((choice) => {
                const surcharge = localOptionsSurcharge(product, { Kleur: choice });
                return (
                  <label key={choice} className={styles.colorCard}>
                    <input
                      type="radio"
                      name="mast-kleur"
                      checked={color === choice}
                      onChange={() => {
                        setColor(choice);
                        setAdded(false);
                      }}
                    />
                    <span className={styles.colorInner}>
                      <span
                        className={styles.colorSwatch}
                        style={{ background: COATING_SWATCH[choice] ?? "#ddd" }}
                        aria-hidden="true"
                      />
                      <span className={styles.colorText}>
                        <span className={styles.colorName}>{choice}</span>
                        <span className={styles.colorSurcharge}>
                          {surcharge > 0 ? `+${fmt(surcharge)}` : "Geen meerprijs"}
                        </span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* 3 — Aantal + mast-staffel */}
          <fieldset className={pstyles.group}>
            <legend className={pstyles.groupLabel}>
              <span>
                <span className={styles.stepNo}>3</span>Aantal masten
              </span>
              {mastDiscountRate > 0 && (
                <span className={pstyles.groupValue}>−{Math.round(mastDiscountRate * 100)}% mastkorting</span>
              )}
            </legend>
            <div className={pstyles.customQtyRow}>
              <div className={pstyles.quantity}>
                <button
                  type="button"
                  className={pstyles.qtyBtn}
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
                  className={pstyles.qtyInput}
                  min={1}
                  value={quantity}
                  aria-label="Aantal masten"
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setQuantity(Number.isFinite(next) && next >= 1 ? Math.floor(next) : 1);
                    setAdded(false);
                  }}
                />
                <button
                  type="button"
                  className={pstyles.qtyBtn}
                  onClick={() => {
                    setQuantity((q) => q + 1);
                    setAdded(false);
                  }}
                  aria-label="Aantal verhogen"
                >
                  +
                </button>
              </div>
              {mastDiscount > 0 ? (
                <span className={pstyles.savings}>Je bespaart {fmt(mastDiscount)}</span>
              ) : (
                <span className={styles.hint}>
                  Vanaf 3 masten krijg je 5% mastkorting op de hardware.
                </span>
              )}
            </div>
          </fieldset>

          {/* 4 — Service & plaatsing */}
          <fieldset className={pstyles.group}>
            <legend className={pstyles.groupLabel}>
              <span>
                <span className={styles.stepNo}>4</span>Service &amp; plaatsing
              </span>
              <span className={pstyles.groupValue}>{fmt(serviceCost)}</span>
            </legend>
            <div className={styles.serviceGrid}>
              <label className={styles.serviceCard}>
                <input
                  type="radio"
                  name="mast-service"
                  checked={service === "levering"}
                  onChange={() => {
                    setService("levering");
                    setAdded(false);
                  }}
                />
                <span className={styles.serviceInner}>
                  <span className={styles.serviceHead}>
                    <span className={styles.serviceName}>
                      <Truck size={16} aria-hidden="true" /> Levering
                    </span>
                    <span className={styles.serviceCost}>{fmt(leveringCost)}</span>
                  </span>
                  <span className={styles.serviceModel}>
                    Je plaatst de mast zelf. {fmt(LEVERING_EERSTE)} voor de 1e mast
                    · {fmt(LEVERING_EXTRA)} per extra mast.
                  </span>
                </span>
              </label>

              <label className={styles.serviceCard}>
                <input
                  type="radio"
                  name="mast-service"
                  checked={service === "montage"}
                  onChange={() => {
                    setService("montage");
                    setAdded(false);
                  }}
                />
                <span className={styles.serviceInner}>
                  <span className={styles.serviceHead}>
                    <span className={styles.serviceName}>
                      <User size={16} aria-hidden="true" /> Montage-service
                    </span>
                    <span className={styles.serviceCost}>{fmt(montageCost)}</span>
                  </span>
                  <span className={styles.serviceModel}>
                    Wij plaatsen de mast. {fmt(MONTAGE_PER_MAST)} per mast · eenmalig
                    {" "}
                    {fmt(MONTAGE_VOORRIJDEN)} voorrijden.
                  </span>
                  {service === "montage" && (
                    <span className={styles.servicePlanning}>
                      Plaatsing vaak binnen 3 tot 4 weken
                    </span>
                  )}
                </span>
              </label>
            </div>
            <p className={styles.hint}>
              De servicekosten zijn een indicatie. De definitieve prijs en planning
              bevestigen we in de offerte.
            </p>
          </fieldset>
        </div>
      </div>

      {/* ---- Sticky prijsbalk ---- */}
      <div className={pstyles.buyBar}>
        <div className={pstyles.priceBlock}>
          <span className={pstyles.priceLabel}>Richtprijs totaal</span>
          <span className={pstyles.priceValue}>{fmt(totalEx)}</span>
          <span className={pstyles.priceNote}>
            {`${quantity} mast${quantity > 1 ? "en" : ""} · incl. ${serviceLabel.toLowerCase()} · ${btwLabel} · definitieve prijs in de offerte`}
          </span>
        </div>

        <div className={pstyles.actions}>
          {mastDiscount > 0 && (
            <span className={styles.savingChip}>
              <Check size={13} aria-hidden="true" /> Je bespaart {fmt(mastDiscount)}
            </span>
          )}
          <Button size="lg" onClick={handleAdd} icon={<ArrowRight />}>
            In winkelmand
          </Button>
          <Link href={`/contact?product=${product.slug}`} className={pstyles.quoteLink}>
            Direct offerte aanvragen
          </Link>
        </div>
      </div>

      {added && (
        <p className={pstyles.added} role="status">
          <Badge variant="success" icon={<Check size={14} />}>
            Toegevoegd aan winkelmand
          </Badge>
          <Link href="/winkelwagen">Naar winkelmand</Link>
        </p>
      )}
    </div>
  );
}
