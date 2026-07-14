/**
 * Herbestellen — reconstrueer winkelmandregels uit opgeslagen orderregels.
 *
 * Isomorf (geen `server-only`/`use client`): het klantportaal roept dit
 * server-side aan om een order om te zetten naar cart-payloads, en de
 * client-knop (`ReorderButton`) zet die payloads via `addItem` in de mand.
 *
 * Een orderregel bewaart in `configuration` de menselijke keuzes (`selections`),
 * de Probo-optiecodes (`options`) en — sinds de portaal-build — het `sizeLabel`.
 * De maat/afmetingen en de indicatieve stukprijs worden hier opnieuw bepaald via
 * de catalogus (`getProduct`/`getSize`) en het lokale prijsmodel
 * (`localUnitPriceWithOptions`) — dezelfde bronnen als de productconfigurator,
 * zodat de mand exact dezelfde regel oplevert als bij de eerste bestelling.
 */

import type { OrderItemRow } from "@/lib/db/types";
import type { CartItem, CartOption } from "@/components/cart/types";
import { getProduct } from "@/lib/catalog/products";
import { getSize, localUnitPriceWithOptions } from "@/lib/pricing/local-catalog";

/** Vorm van de `configuration`-JSONB op een orderregel (relevante velden). */
interface StoredConfiguration {
  code?: string;
  selections?: Record<string, string>;
  sizeLabel?: string;
}

/** Nieuwe cart-regel zonder client-id — klaar voor `addItem`. */
export type ReorderCartLine = Omit<CartItem, "id">;

/**
 * Bepaal het maatlabel van een orderregel. Nieuwe orders bewaren `sizeLabel` in
 * de configuratie; voor oudere orders zonder dat veld vallen we terug op de
 * eerste (goedkoopste) catalogusmaat, zodat herbestellen altijd een geldige
 * regel oplevert (de klant kan de maat in de mand nog aanpassen).
 */
function resolveSizeLabel(
  config: StoredConfiguration,
  productSizes: { label: string }[],
): string | undefined {
  if (config.sizeLabel) return config.sizeLabel;
  return productSizes[0]?.label;
}

/**
 * Zet één opgeslagen orderregel om naar een winkelmandregel.
 *
 * @param keepDesign  true → neem het oorspronkelijke ontwerp (`file_url`) mee;
 *                    false → laat het ontwerp leeg zodat de klant in de mand een
 *                    nieuw ontwerp uploadt ("zelfde bestelling, ander ontwerp").
 * Geeft `null` als het product niet meer in de catalogus bestaat.
 */
export function orderItemToCartLine(
  item: OrderItemRow,
  keepDesign: boolean,
): ReorderCartLine | null {
  const product = getProduct(item.product_type);
  if (!product) return null;

  const config = (item.configuration ?? {}) as StoredConfiguration;
  const selections = config.selections ?? {};
  const sizeLabel = resolveSizeLabel(config, product.sizes);
  const size = sizeLabel ? getSize(product, sizeLabel) : undefined;

  const options: CartOption[] = Object.entries(selections).map(([code, value]) => ({
    code,
    value,
  }));

  const line: ReorderCartLine = {
    slug: product.slug,
    name: item.product_name ?? product.name,
    // De mand beslist quote-only/orderbaar op de catalogus-code (net als de
    // productpagina); de checkout leidt de effectieve Probo-code opnieuw af.
    proboProductCode: product.proboProductCode,
    options,
    amount: item.amount,
    unitPriceEstimate: localUnitPriceWithOptions(product, size, selections),
    sizeLabel: sizeLabel ?? "",
    widthCm: size?.widthCm,
    heightCm: size?.heightCm,
  };

  if (keepDesign && item.file_url) {
    line.fileUrl = item.file_url;
  }

  return line;
}

/** Zet alle regels van een order om naar winkelmandregels (skipt onbekende). */
export function orderItemsToCartLines(
  items: OrderItemRow[],
  keepDesign: boolean,
): ReorderCartLine[] {
  return items
    .map((it) => orderItemToCartLine(it, keepDesign))
    .filter((line): line is ReorderCartLine => line !== null);
}
