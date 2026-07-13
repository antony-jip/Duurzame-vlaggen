"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./winkelwagen.module.css";
import { Badge, Button, Card, Container, ArrowRight, Leaf } from "@/components/ui";
import { useCart } from "@/components/cart/CartProvider";
import { ArtworkUpload } from "@/components/cart/ArtworkUpload";
import { formatCurrency } from "@/lib/i18n/formatting";
import { getProduct, type CatalogProduct } from "@/lib/catalog/products";

const accentClass: Record<CatalogProduct["accent"], string> = {
  forest: styles.accentForest,
  terracotta: styles.accentTerracotta,
  "sage-blue": styles.accentSageBlue,
  "sage-purple": styles.accentSagePurple,
  "copper-rust": styles.accentCopperRust,
};

export default function WinkelwagenPage() {
  const { items, subtotal, updateAmount, removeItem, hydrated, catalog } =
    useCart();

  if (!hydrated) {
    return (
      <Container as="section" className={styles.page}>
        <p className="text-sm">Bezig met laden…</p>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container as="section" className={styles.page} aria-labelledby="cart-title">
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <Leaf size={30} />
          </span>
          <h1 id="cart-title">Je winkelmand is leeg</h1>
          <p className="text-sm">
            Bekijk de collectie en stel je duurzame vlag samen.
          </p>
          <Button as="a" href="/collectie" size="lg" icon={<ArrowRight />}>
            Bekijk de collectie
          </Button>
        </div>
      </Container>
    );
  }

  const hasQuoteOnly = items.some((it) => it.proboProductCode === null);

  return (
    <Container as="section" className={styles.page} aria-labelledby="cart-title">
      <div className={styles.head}>
        <Badge variant="success">Winkelmand</Badge>
        <h1 id="cart-title">Je winkelmand</h1>
      </div>

      <div className={styles.layout}>
        <div className={styles.lines}>
          {items.map((item) => {
            const product = getProduct(item.slug);
            const accent = product?.accent ?? "forest";
            const details = item.options
              .filter((o) => o.code !== "Formaat")
              .map((o) => `${o.code}: ${o.value ?? "—"}`)
              .join(" · ");
            return (
              <Card key={item.id} className={styles.line} elevation="default">
                <div className={styles.thumb}>
                  {product?.heroImage ? (
                    <Image
                      src={product.heroImage.src}
                      alt={product.heroImage.alt}
                      fill
                      sizes="(max-width: 480px) 64px, 88px"
                      className={styles.thumbPhoto}
                    />
                  ) : (
                    <div
                      className={`${styles.thumbFallback} ${accentClass[accent]}`}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className={styles.lineBody}>
                  <Link href={`/collectie/${item.slug}`} className={styles.lineName}>
                    {item.name}
                  </Link>
                  <span className={styles.lineMeta}>{item.sizeLabel}</span>
                  {details && <span className={styles.lineMeta}>{details}</span>}
                  {item.proboProductCode === null && (
                    <span className={styles.quoteTag}>
                      <Badge variant="detail">Offerte-aanvraag</Badge>
                    </span>
                  )}
                  <ArtworkUpload
                    itemId={item.id}
                    fileUrl={item.fileUrl}
                    fileName={item.fileName}
                  />
                </div>
                <div className={styles.lineControls}>
                  <span className={styles.linePrice}>
                    {formatCurrency(item.unitPriceEstimate * item.amount, catalog)}
                  </span>
                  <div
                    className={styles.quantity}
                    role="group"
                    aria-label={`Aantal ${item.name}`}
                  >
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => updateAmount(item.id, item.amount - 1)}
                      disabled={item.amount <= 1}
                      aria-label="Aantal verlagen"
                    >
                      −
                    </button>
                    <span className={styles.qtyValue} aria-live="polite">
                      {item.amount}
                    </span>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => updateAmount(item.id, item.amount + 1)}
                      aria-label="Aantal verhogen"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => removeItem(item.id)}
                  >
                    Verwijderen
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        <Card as="aside" className={styles.summary} elevation="raised">
          <h2>Overzicht</h2>
          <div className={styles.summaryRow}>
            <span>Subtotaal</span>
            <span>{formatCurrency(subtotal, catalog)}</span>
          </div>
          <p className={styles.summaryNote}>
            Prijzen zijn indicatief en exclusief btw. Verzendkosten en de
            definitieve prijs volgen bij het afrekenen of in de offerte.
          </p>
          <Button as="a" href="/afrekenen" size="lg" fullWidth icon={<ArrowRight />}>
            Naar afrekenen
          </Button>
          {hasQuoteOnly && (
            <p className={styles.summaryNote}>
              Je winkelmand bevat producten die nog niet online bestelbaar zijn.
              Deze worden als offerte-aanvraag verstuurd.
            </p>
          )}
          <Link href="/collectie" className="text-sm">
            Verder winkelen
          </Link>
        </Card>
      </div>
    </Container>
  );
}
