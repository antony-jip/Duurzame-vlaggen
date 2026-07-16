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
import { normalizeCartItem, primaryDesign, type CartItem } from "./types";
import type { ProofFinish, ProofShape } from "./ArtworkProof";
import { sjabloonUrl } from "@/lib/catalog/sjablonen";

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

/**
 * Afwerkingszone voor de drukproef, afgeleid van de gekozen opties: tunnel of
 * ringen aan de mastzijde (baniervlag), band en koord aan de hijszijde
 * (mastvlag) of bovenlangs (gevelvlag). Beachvlag slaan we over: dat doek is
 * niet rechthoekig, dus een rechte zone zou meer misleiden dan helpen.
 */
function deriveFinish(item: CartItem): ProofFinish | undefined {
  if (item.slug === "beachvlag") return undefined;
  const optie = (code: string) =>
    item.options.find((o) => o.code === code)?.value?.toString() ?? "";
  const afwerking = optie("Afwerking");
  const lower = afwerking.toLowerCase();
  const side: ProofFinish["side"] =
    item.slug === "gevelvlag"
      ? "boven"
      : optie("Mastzijde").toLowerCase() === "rechts"
        ? "rechts"
        : "links";
  if (lower.includes("tunnel")) return { kind: "tunnel", side, label: afwerking };
  if (lower.includes("ring")) return { kind: "ringen", side, label: afwerking };
  if (lower.includes("band")) return { kind: "band", side, label: afwerking };
  if (item.slug === "mastvlag" || item.slug === "gevelvlag") {
    return { kind: "band", side, label: "Band en koord" };
  }
  return undefined;
}

/**
 * Beachvlag-model uit het maatlabel ("Straight Small — …" / "Square Medium — …").
 * Het model zit bewust in de maat (elke maat hoort bij één Probo-product).
 */
function beachModel(item: CartItem): "straight" | "square" | null {
  if (item.slug !== "beachvlag") return null;
  if (/^straight/i.test(item.sizeLabel)) return "straight";
  if (/^square/i.test(item.sizeLabel)) return "square";
  return null;
}

/**
 * Doekvorm voor de proef: een straightflag is geen rechthoek maar een doek met
 * een bolle topcurve aan de beachpole. De mastzijde bepaalt de spiegeling.
 */
function deriveShape(item: CartItem): ProofShape | undefined {
  if (beachModel(item) !== "straight") return undefined;
  const zijde = item.options
    .find((o) => o.code === "Mastzijde")
    ?.value?.toString()
    .toLowerCase();
  return { kind: "beachStraight", side: zijde === "rechts" ? "rechts" : "links" };
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
  item: rawItem,
  compact = false,
}: {
  item: CartItem;
  /** Smalle variant voor het winkelmand-paneel: beeld links, de rest eronder. */
  compact?: boolean;
}) {
  const { updateAmount, removeItem } = useCart();

  // Oude manden (één fileUrl per regel) on-the-fly naar design-toewijzingen.
  const item = normalizeCartItem(rawItem);
  const designs = item.designs ?? [];
  const hoofdontwerp = primaryDesign(item);

  const product = getProduct(item.slug);
  const accent = product?.accent ?? "forest";
  const size = flagSize(item);
  const shape = deriveShape(item);
  // De beachvlag heeft één productfoto (straightflag), maar een squareflag in
  // de mand hoort zijn eigen model te tonen.
  const thumbImage =
    beachModel(item) === "square"
      ? {
          src: "/beachvlag/squareflag-strand.webp",
          alt: "Duurzame squareflag beachvlag op het strand",
        }
      : product?.heroImage;
  // De mockup kan alleen als we én een bestand én de echte maat hebben.
  const heeftOntwerp = Boolean(hoofdontwerp && size.widthCm && size.heightCm);
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
          src={hoofdontwerp!.previewUrl ?? hoofdontwerp!.fileUrl!}
          isImage={
            !!hoofdontwerp!.previewUrl ||
            isImageArtwork(hoofdontwerp!.fileName, hoofdontwerp!.fileUrl)
          }
          widthCm={size.widthCm!}
          heightCm={size.heightCm!}
          shape={shape}
          alt={`Je ontwerp op de ${item.name} van ${item.sizeLabel}`}
        />
      ) : (
        <div className={styles.thumb}>
          {thumbImage ? (
            <Image
              src={thumbImage.src}
              alt={thumbImage.alt}
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
        {/* Hardware (vlaggenmast) heeft geen drukbestand; alleen drukwerk
            krijgt de ontwerp-toewijzingen. */}
        {product?.category !== "hardware" && (
          <ArtworkUpload
            itemId={item.id}
            amount={item.amount}
            designs={designs}
            finish={deriveFinish(item)}
            shape={shape}
            sjabloon={sjabloonUrl({
              slug: item.slug,
              widthCm: size.widthCm,
              heightCm: size.heightCm,
              selections: Object.fromEntries(
                item.options.map((o) => [o.code, String(o.value ?? "")]),
              ),
            })}
            {...size}
          />
        )}
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
