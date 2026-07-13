"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./winkelwagen.module.css";
import {
  Badge,
  Button,
  Card,
  Container,
  ArrowRight,
  Leaf,
  Recycle,
  Truck,
  Price,
} from "@/components/ui";
import { useCart } from "@/components/cart/CartProvider";
import { ArtworkUpload } from "@/components/cart/ArtworkUpload";
import { ArtworkProof } from "@/components/cart/ArtworkProof";
import { getProduct, type CatalogProduct } from "@/lib/catalog/products";
import { localCartLineTotal } from "@/lib/pricing/local-catalog";

/**
 * Flag dimensions for the artwork resolution check. Prefer the fields stored on
 * the line; fall back to parsing the human `sizeLabel` (e.g. "250 × 100 cm") for
 * carts persisted before those fields existed. Returns empty when unknown.
 */
function flagSize(item: {
  widthCm?: number;
  heightCm?: number;
  sizeLabel: string;
}): { widthCm?: number; heightCm?: number } {
  if (item.widthCm && item.heightCm) {
    return { widthCm: item.widthCm, heightCm: item.heightCm };
  }
  const m = /(\d+)\s*[×x]\s*(\d+)\s*cm/i.exec(item.sizeLabel);
  if (m) return { widthCm: Number(m[1]), heightCm: Number(m[2]) };
  return {};
}

/** Is the attached artwork a raster image (vs PDF)? Filename is leading; the
 *  url covers storage links and inline data-URLs (local preview fallback). */
function isImageArtwork(fileName?: string | null, fileUrl?: string | null): boolean {
  return (
    /\.(jpe?g|png)$/i.test(fileName ?? "") ||
    /\.(jpe?g|png)$/i.test(fileUrl ?? "") ||
    /^data:image\//i.test(fileUrl ?? "")
  );
}

const accentClass: Record<CatalogProduct["accent"], string> = {
  forest: styles.accentForest,
  terracotta: styles.accentTerracotta,
  "sage-blue": styles.accentSageBlue,
  "sage-purple": styles.accentSagePurple,
  "copper-rust": styles.accentCopperRust,
};

export default function WinkelwagenPage() {
  const { items, subtotal, updateAmount, removeItem, hydrated, inclVat } =
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

  const quoteOnlyNames = Array.from(
    new Set(
      items.filter((it) => it.proboProductCode === null).map((it) => it.name),
    ),
  );
  const hasQuoteOnly = quoteOnlyNames.length > 0;

  return (
    <Container as="section" className={styles.page} aria-labelledby="cart-title">
      <div className={styles.head}>
        <Badge variant="success">Winkelmand</Badge>
        <h1 id="cart-title">Je winkelmand.</h1>
      </div>

      <div className={styles.layout}>
        <div className={styles.lines}>
          {items.map((item) => {
            const product = getProduct(item.slug);
            const accent = product?.accent ?? "forest";
            const size = flagSize(item);
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
                    filePath={item.filePath}
                    fileWarnings={item.fileWarnings}
                    previewUrl={item.previewUrl}
                    {...size}
                  />
                  {/* Mini-mockup: het aangeleverde ontwerp op de vlag van
                      precies déze regel (echte breedte/hoogte-verhouding).
                      Bij voorkeur de raster-preview (toont ook de echte
                      eerste PDF-pagina en overleeft navigatie). */}
                  {item.fileUrl && size.widthCm && size.heightCm && (
                    <ArtworkProof
                      mode="mockup"
                      small
                      src={item.previewUrl ?? item.fileUrl}
                      isImage={
                        !!item.previewUrl ||
                        isImageArtwork(item.fileName, item.fileUrl)
                      }
                      widthCm={size.widthCm}
                      heightCm={size.heightCm}
                      alt={`Je ontwerp op de ${item.name} van ${item.sizeLabel}`}
                    />
                  )}
                </div>
                <div className={styles.lineControls}>
                  <span className={styles.linePrice}>
                    <Price amount={localCartLineTotal(item.unitPriceEstimate, item.amount)} />
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
            <span>
              <Price amount={subtotal} />
            </span>
          </div>
          <p className={styles.summaryNote}>
            Prijzen zijn indicatief en {inclVat ? "inclusief" : "exclusief"} btw.
            Verzendkosten en de definitieve prijs volgen bij het afrekenen of in
            de offerte.
          </p>
          <Button as="a" href="/afrekenen" size="lg" fullWidth icon={<ArrowRight />}>
            Naar afrekenen
          </Button>
          {hasQuoteOnly && (
            <p className={styles.summaryNote}>
              {quoteOnlyNames.join(", ")}{" "}
              {quoteOnlyNames.length > 1 ? "zijn" : "is"} nog niet online
              bestelbaar en {quoteOnlyNames.length > 1 ? "worden" : "wordt"} als
              offerte-aanvraag verstuurd.
            </p>
          )}
          <ul className={styles.trust}>
            <li>
              <Leaf size={16} aria-hidden="true" /> 100% biologisch afbreekbaar
              doek
            </li>
            <li>
              <Recycle size={16} aria-hidden="true" /> Circulair geproduceerd in
              Nederland
            </li>
            <li>
              <Truck size={16} aria-hidden="true" /> Binnen 5 werkdagen geleverd
            </li>
          </ul>
          <Link href="/collectie" className="text-sm">
            Verder winkelen
          </Link>
        </Card>
      </div>
    </Container>
  );
}
