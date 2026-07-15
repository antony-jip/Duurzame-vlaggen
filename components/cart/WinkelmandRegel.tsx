"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./WinkelmandRegel.module.css";
import { Badge, Price } from "@/components/ui";
import { useCart } from "./CartProvider";
import { ArtworkUpload } from "./ArtworkUpload";
import { ArtworkProof } from "./ArtworkProof";
import { getProduct, type CatalogProduct } from "@/lib/catalog/products";
import {
  localCartLineTotal,
  staffelDiscount,
  volgendeStaffel,
} from "@/lib/pricing/local-catalog";
import type { CartItem } from "./types";

/**
 * Eén bewerkbare winkelmandregel: het ontwerp op de vlag, de keuzes, het aantal
 * en de prijs.
 *
 * Woont hier en niet in een pagina omdat mand en afrekenen zijn samengevoegd tot
 * één pagina (/afrekenen). Die twee toonden hiervoor allebei hun eigen variant
 * van dezelfde regel — zelfde aantalkiezer, zelfde mockup, zelfde subtotaal —
 * wat een extra stap opleverde die de klant niets gaf.
 */

/**
 * Vlagafmetingen. Bij voorkeur de velden op de regel; anders uit het menselijke
 * `sizeLabel` (bijv. "250 × 100 cm") voor manden van vóór die velden bestonden.
 */
function flagSize(item: CartItem): { widthCm?: number; heightCm?: number } {
  if (item.widthCm && item.heightCm) {
    return { widthCm: item.widthCm, heightCm: item.heightCm };
  }
  const m = /(\d+)\s*[×x]\s*(\d+)\s*cm/i.exec(item.sizeLabel);
  if (m) return { widthCm: Number(m[1]), heightCm: Number(m[2]) };
  return {};
}

/** Is het ontwerp een rasterafbeelding (i.p.v. PDF)? */
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

export function WinkelmandRegel({
  item,
  compact = false,
}: {
  item: CartItem;
  /** Smalle variant voor het winkelmand-paneel: beeld links, de rest eronder. */
  compact?: boolean;
}) {
  const { updateAmount, removeItem } = useCart();

  const product = getProduct(item.slug);
  const accent = product?.accent ?? "forest";
  const size = flagSize(item);
  // De mockup kan alleen als we én een bestand én de echte maat hebben.
  const heeftOntwerp = Boolean(item.fileUrl && size.widthCm && size.heightCm);
  const korting = staffelDiscount(item.amount);
  const volgende = volgendeStaffel(item.amount);
  const details = item.options
    .filter((o) => o.code !== "Formaat")
    .map((o) => `${o.code}: ${o.value ?? "—"}`)
    .join(" · ");

  return (
    <article className={`${styles.regel} ${compact ? styles.compact : ""}`}>
      {/* Eén beeld per regel: jouw ontwerp op de vlag van déze maat, want dat is
          wat je koopt. Zonder ontwerp valt de sfeerfoto van het product in. */}
      {heeftOntwerp ? (
        <ArtworkProof
          mode="mockup"
          small
          className={styles.mockup}
          src={item.previewUrl ?? item.fileUrl!}
          isImage={!!item.previewUrl || isImageArtwork(item.fileName, item.fileUrl)}
          widthCm={size.widthCm!}
          heightCm={size.heightCm!}
          alt={`Je ontwerp op de ${item.name} van ${item.sizeLabel}`}
        />
      ) : (
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
      )}

      <div className={styles.body}>
        <Link href={`/collectie/${item.slug}`} className={styles.naam}>
          {item.name}
        </Link>
        <span className={styles.meta}>{item.sizeLabel}</span>
        {details && <span className={styles.meta}>{details}</span>}
        {item.proboProductCode === null && (
          <span className={styles.quoteTag}>
            <Badge variant="detail">Offerte-aanvraag</Badge>
          </span>
        )}
        {/* Geen eigen thumbnail: het ontwerp staat hiernaast al op de vlag. */}
        <ArtworkUpload
          itemId={item.id}
          fileUrl={item.fileUrl}
          fileName={item.fileName}
          filePath={item.filePath}
          fileWarnings={item.fileWarnings}
          previewUrl={item.previewUrl}
          toonPreview={!heeftOntwerp}
          {...size}
        />
      </div>

      <div className={styles.controls}>
        <span className={styles.prijs}>
          <Price amount={localCartLineTotal(item.unitPriceEstimate, item.amount)} />
        </span>
        <div className={styles.quantity} role="group" aria-label={`Aantal ${item.name}`}>
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

        {/* De staffelkorting zat al in de regelprijs verwerkt, maar was nergens
            te zien: je zag alleen een bedrag dat niet klopte met aantal ×
            stukprijs. Nu benoemen we hem, en wijzen we op de volgende staffel. */}
        {korting > 0 && (
          <span className={styles.kortingBadge}>
            {Math.round(korting * 100)}% staffelkorting
          </span>
        )}
        {volgende && (
          <button
            type="button"
            className={styles.staffelNudge}
            onClick={() => updateAmount(item.id, volgende.qty)}
          >
            +{volgende.erbij} erbij → {Math.round(volgende.discount * 100)}% korting
          </button>
        )}

        <button
          type="button"
          className={styles.remove}
          onClick={() => removeItem(item.id)}
        >
          Verwijderen
        </button>
      </div>
    </article>
  );
}
