import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge, Container } from "@/components/ui";
import { requireCustomer } from "../../auth";
import { getCustomerOrder } from "@/lib/orders/customer";
import { getOrderItems } from "@/lib/orders/repository";
import { getProduct } from "@/lib/catalog/products";
import { orderItemToCartLine, orderItemsToCartLines } from "@/lib/orders/reorder";
import type { OrderItemRow } from "@/lib/db/types";
import type { ProboAddress } from "@/lib/probo/products";
import { ReorderButton } from "../../ReorderButton";
import {
  CUSTOMER_STATUS_LABELS,
  customerStatusVariant,
  formatMoney,
  formatDate,
  isImageUrl,
} from "../../format";
import styles from "../../account.module.css";

export const metadata: Metadata = {
  title: "Bestelling · Mijn account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Menselijke keuzes uit de opgeslagen configuratie (label → waarde). */
function selectionsText(item: OrderItemRow): string {
  const config = (item.configuration ?? {}) as { selections?: Record<string, string> };
  const sel = config.selections ?? {};
  return Object.entries(sel)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

/** Opgeslagen maatlabel (nieuwe orders), anders leeg. */
function sizeText(item: OrderItemRow): string {
  const config = (item.configuration ?? {}) as { sizeLabel?: string };
  return config.sizeLabel ?? "";
}

function AddressBlock({ address }: { address: ProboAddress }) {
  const name = [address.first_name, address.last_name].filter(Boolean).join(" ");
  const line = [address.street, address.house_number, address.addition]
    .filter(Boolean)
    .join(" ");
  const city = [address.postal_code, address.city].filter(Boolean).join(" ");
  return (
    <div>
      {address.company_name && <div>{address.company_name}</div>}
      {name && <div>{name}</div>}
      {line && <div>{line}</div>}
      {city && <div>{city}</div>}
      {address.country && <div>{address.country}</div>}
    </div>
  );
}

/** Milestone-tijdlijn uit de bekende timestamp-kolommen (geen interne events). */
function milestones(order: {
  created_at: string;
  paid_at: string | null;
  ordered_at: string | null;
  shipped_at: string | null;
}): { label: string; date: string }[] {
  const out: { label: string; date: string }[] = [
    { label: "Besteld", date: order.created_at },
  ];
  if (order.paid_at) out.push({ label: "Betaald", date: order.paid_at });
  if (order.ordered_at) out.push({ label: "In behandeling genomen", date: order.ordered_at });
  if (order.shipped_at) out.push({ label: "Verzonden", date: order.shipped_at });
  return out;
}

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const identity = await requireCustomer();
  const { id } = await params;

  // Ownership wordt server-side geverifieerd; niet bij deze klant → 404.
  const order = await getCustomerOrder(id, identity);
  if (!order) notFound();

  const items = await getOrderItems(order.id);
  const reorderLines = orderItemsToCartLines(items, true);
  const shipping = (order.shipping_address ?? null) as ProboAddress | null;

  return (
    <Container as="section" className={styles.page}>
      <Link href="/account" className={styles.backLink}>
        ← Terug naar mijn bestellingen
      </Link>

      <div className={styles.head}>
        <div className={styles.headText}>
          <Badge variant={customerStatusVariant(order.status)}>
            {CUSTOMER_STATUS_LABELS[order.status]}
          </Badge>
          <h1>{order.order_number}</h1>
          <p>Besteld op {formatDate(order.created_at)}</p>
        </div>
        {reorderLines.length > 0 && (
          <div className={styles.reorderBar}>
            <ReorderButton
              lines={reorderLines}
              label="Opnieuw bestellen"
              size="md"
            />
            <ReorderButton
              lines={reorderLines}
              stripDesign
              variant="secondary"
              label="Zelfde bestelling, ander ontwerp"
              size="md"
            />
          </div>
        )}
      </div>

      {/* Regels */}
      <div className={`${styles.card} ${styles.lineList}`} style={{ marginBottom: "var(--space-lg)" }}>
        {items.map((it) => {
          const product = getProduct(it.product_type);
          const line = orderItemToCartLine(it, true);
          const size = sizeText(it);
          const sel = selectionsText(it);
          const thumbSrc = isImageUrl(it.file_url)
            ? (it.file_url as string)
            : product?.heroImage.src;
          return (
            <div key={it.id} className={styles.line}>
              {thumbSrc && (
                <span className={styles.lineThumb}>
                  <Image
                    src={thumbSrc}
                    alt=""
                    fill
                    sizes="64px"
                    className={styles.lineThumbImg}
                  />
                </span>
              )}
              <div className={styles.lineBody}>
                <span className={styles.lineName}>
                  {it.product_name ?? product?.name ?? it.product_type}
                </span>
                {size && <span className={styles.lineMeta}>{size}</span>}
                {sel && <span className={styles.lineMeta}>{sel}</span>}
                {it.file_url && (
                  <span className={styles.lineDesign}>
                    <a
                      href={it.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.lineDesignLink}
                    >
                      Aangeleverd ontwerp bekijken
                    </a>
                  </span>
                )}
                {line && (
                  <div className={styles.lineDesign}>
                    <ReorderButton
                      lines={[line]}
                      variant="tertiary"
                      size="sm"
                      label="Deze regel opnieuw bestellen"
                    />
                  </div>
                )}
              </div>
              <div className={styles.lineRight}>
                <span className={styles.lineMeta}>Aantal: {it.amount}</span>
                <span className={styles.linePrice}>
                  {formatMoney(it.line_price, order.currency)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.detailGrid}>
        {/* Totalen */}
        <div className={styles.card}>
          <h2>Overzicht</h2>
          <dl className={styles.dl}>
            <dt>Subtotaal (excl. btw)</dt>
            <dd>{formatMoney(order.subtotal_ex_vat, order.currency)}</dd>
            <dt>Verzendkosten</dt>
            <dd>{formatMoney(order.shipping_cost, order.currency)}</dd>
            <dt>Btw</dt>
            <dd>{formatMoney(order.vat_amount, order.currency)}</dd>
            <dt>Totaal (incl. btw)</dt>
            <dd>
              <strong>{formatMoney(order.total, order.currency)}</strong>
            </dd>
          </dl>
        </div>

        {/* Verzending */}
        <div className={styles.card}>
          <h2>Verzendadres</h2>
          {shipping ? (
            <AddressBlock address={shipping} />
          ) : (
            <p className={styles.muted}>—</p>
          )}
          {order.tracking_url && (
            <p style={{ marginTop: "var(--space-sm)" }}>
              <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className={styles.lineDesignLink}>
                Volg je zending
              </a>
            </p>
          )}
        </div>

        {/* Tijdlijn */}
        <div className={styles.card}>
          <h2>Status</h2>
          <ol className={styles.timeline}>
            {milestones(order).map((m) => (
              <li key={m.label} className={styles.timelineItem}>
                <span className={styles.timelineDot} aria-hidden="true" />
                <span className={styles.timelineLabel}>{m.label}</span>
                <span className={styles.timelineDate}>{formatDate(m.date)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Container>
  );
}
