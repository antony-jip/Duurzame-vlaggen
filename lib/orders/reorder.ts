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

import type { OrderItemRow, OrderItemDesignRow } from "@/lib/db/types";
import { clientId, type CartDesign, type CartItem, type CartOption } from "@/components/cart/types";
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

/** Storage-key uit een publieke order-artwork-URL (`${uuid}-${naam}`). */
function artworkPathFromUrl(url: string): string | null {
  const marker = "/order-artwork/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length)) || null;
}

/**
 * Zet één opgeslagen orderregel om naar een winkelmandregel.
 *
 * @param keepDesign  true → neem het oorspronkelijke ontwerp mee;
 *                    false → laat het ontwerp leeg zodat de klant in de mand een
 *                    nieuw ontwerp uploadt ("zelfde bestelling, ander ontwerp").
 * @param designs     de design-toewijzingen van de regel (order_item_designs).
 *                    Meegegeven → de mand krijgt exact dezelfde verdeling
 *                    ("2× ontwerp A, 3× ontwerp B"), met verwijzingen naar
 *                    dezelfde storage-objecten (geen kopieën). Zonder designs
 *                    valt het terug op het losse `file_url` (oudere orders).
 * Geeft `null` als het product niet meer in de catalogus bestaat.
 */
export function orderItemToCartLine(
  item: OrderItemRow,
  keepDesign: boolean,
  designs?: OrderItemDesignRow[],
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

  if (keepDesign) {
    const rows = (designs ?? []).filter((d) => d.file_url !== null);
    if (rows.length > 0) {
      // Exacte verdeling terug in de mand. Openstaande slots van toen komen
      // niet mee: die zijn al of alsnog aangeleverd, of bewust vervallen.
      const cartDesigns: CartDesign[] = rows.map((d) => ({
        id: clientId(),
        quantity: d.quantity,
        fileUrl: d.file_url,
        fileName: d.file_name,
        filePath: d.file_path,
        fileWarnings: Array.isArray(d.file_warnings)
          ? (d.file_warnings as string[]).filter((w) => typeof w === "string")
          : [],
      }));
      // Toewijzingen moeten optellen tot het aantal; dekten de bestanden niet
      // alles (deel was nooit aangeleverd), laat het gat dan bij het eerste
      // ontwerp horen zodat de regel meteen compleet in de mand ligt.
      const assigned = cartDesigns.reduce((sum, d) => sum + d.quantity, 0);
      if (assigned < item.amount && cartDesigns[0]) {
        cartDesigns[0].quantity += item.amount - assigned;
      }
      line.designs = cartDesigns;
    } else if (item.file_url) {
      line.designs = [
        {
          id: clientId(),
          quantity: item.amount,
          fileUrl: item.file_url,
          fileName: null,
          filePath: artworkPathFromUrl(item.file_url),
          fileWarnings: [],
        },
      ];
    }
  }

  return line;
}

/** Zet alle regels van een order om naar winkelmandregels (skipt onbekende). */
export function orderItemsToCartLines(
  items: OrderItemRow[],
  keepDesign: boolean,
  designsByItem?: Map<string, OrderItemDesignRow[]>,
): ReorderCartLine[] {
  return items
    .map((it) => orderItemToCartLine(it, keepDesign, designsByItem?.get(it.id)))
    .filter((line): line is ReorderCartLine => line !== null);
}
