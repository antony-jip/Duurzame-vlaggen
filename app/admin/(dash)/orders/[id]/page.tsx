import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { getOrderById, getOrderItems } from "@/lib/orders/repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ALLOWED_TRANSITIONS } from "@/lib/orders/state-machine";
import type { OrderEventRow } from "@/lib/db/types";
import { STATUS_LABELS, statusBadgeVariant, formatMoney, formatDateTime } from "../../../format";
import { requireAdminPage } from "../../../auth";
import {
  refreshProboStatusAction,
  sendToProboAction,
  refreshPaymentAction,
  advanceStatusAction,
} from "./actions";
import styles from "../../admin.module.css";

export const metadata: Metadata = {
  title: "Orderdetail · Admin",
  robots: { index: false, follow: false },
};

/** Read the event timeline for an order (admin client, oldest first). */
async function getOrderEvents(orderId: string): Promise<OrderEventRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("order_events")
    .select()
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getOrderEvents failed: ${error.message}`);
  return (data ?? []) as OrderEventRow[];
}

function AddressBlock({ value }: { value: unknown }) {
  if (!value || typeof value !== "object") return <span className={styles.muted}>—</span>;
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  if (entries.length === 0) return <span className={styles.muted}>—</span>;
  return (
    <div className={styles.address}>
      {entries.map(([k, v]) => (
        <div key={k}>
          <span className={styles.addressKey}>{k}</span>
          <span>{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const [items, events] = await Promise.all([getOrderItems(order.id), getOrderEvents(order.id)]);
  const nextStatuses = ALLOWED_TRANSITIONS[order.status];

  return (
    <section className={styles.detail}>
      <div className={styles.detailHead}>
        <div>
          <Link href="/admin" className={styles.backLink}>
            ← Terug naar orders
          </Link>
          <h1 className={styles.pageTitle}>{order.order_number}</h1>
          <div className={styles.detailMeta}>
            <Badge variant={statusBadgeVariant(order.status)}>{STATUS_LABELS[order.status]}</Badge>
            <span className={styles.muted}>{formatDateTime(order.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Acties */}
      <Card className={styles.actions}>
        <h2 className={styles.sectionTitle}>Acties</h2>
        <div className={styles.actionRow}>
          {order.status === "paid" && (
            <form action={sendToProboAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <Button type="submit" size="sm">
                Verstuur naar Probo
              </Button>
            </form>
          )}
          {order.probo_order_id && (
            <form action={refreshProboStatusAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <Button type="submit" size="sm" variant="secondary">
                Ververs Probo-status
              </Button>
            </form>
          )}
          {order.mollie_payment_id && (
            <form action={refreshPaymentAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <Button type="submit" size="sm" variant="secondary">
                Ververs betaling
              </Button>
            </form>
          )}
          {nextStatuses.map((to) => (
            <form action={advanceStatusAction} key={to}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="to" value={to} />
              <Button type="submit" size="sm" variant="tertiary">
                → {STATUS_LABELS[to]}
              </Button>
            </form>
          ))}
          {nextStatuses.length === 0 &&
            !order.probo_order_id &&
            !order.mollie_payment_id &&
            order.status !== "paid" && (
              <span className={styles.muted}>Geen acties beschikbaar (eindstatus).</span>
            )}
        </div>
      </Card>

      <div className={styles.detailGrid}>
        {/* Ordergegevens */}
        <Card>
          <h2 className={styles.sectionTitle}>Ordergegevens</h2>
          <dl className={styles.dl}>
            <dt>E-mail</dt>
            <dd>{order.email}</dd>
            <dt>Telefoon</dt>
            <dd>{order.phone ?? "—"}</dd>
            <dt>Markt</dt>
            <dd className={styles.upper}>{order.market}</dd>
            <dt>Zakelijk</dt>
            <dd>{order.is_business ? "Ja" : "Nee"}</dd>
            <dt>Btw-nummer</dt>
            <dd>
              {order.vat_number ?? "—"}
              {order.vat_number_valid === true && " (geldig)"}
              {order.vat_number_valid === false && " (ongeldig)"}
            </dd>
            <dt>Verlegd (reverse charge)</dt>
            <dd>{order.reverse_charge ? "Ja" : "Nee"}</dd>
            <dt>Btw-tarief</dt>
            <dd>{order.vat_rate !== null ? `${order.vat_rate}%` : "—"}</dd>
          </dl>
        </Card>

        {/* Bedragen */}
        <Card>
          <h2 className={styles.sectionTitle}>Bedragen</h2>
          <dl className={styles.dl}>
            <dt>Subtotaal (excl. btw)</dt>
            <dd>{formatMoney(order.subtotal_ex_vat, order.currency)}</dd>
            <dt>Verzendkosten</dt>
            <dd>{formatMoney(order.shipping_cost, order.currency)}</dd>
            <dt>Btw</dt>
            <dd>{formatMoney(order.vat_amount, order.currency)}</dd>
            <dt>Totaal</dt>
            <dd>
              <strong>{formatMoney(order.total, order.currency)}</strong>
            </dd>
          </dl>
        </Card>

        {/* Betaling & fulfilment */}
        <Card>
          <h2 className={styles.sectionTitle}>Betaling & fulfilment</h2>
          <dl className={styles.dl}>
            <dt>Mollie-betaling</dt>
            <dd className={styles.mono}>{order.mollie_payment_id ?? "—"}</dd>
            <dt>Mollie-status</dt>
            <dd>{order.mollie_status ?? "—"}</dd>
            <dt>Probo-order</dt>
            <dd className={styles.mono}>{order.probo_order_id ?? "—"}</dd>
            <dt>Probo-status</dt>
            <dd>{order.probo_status ?? "—"}</dd>
            <dt>Vervoerder</dt>
            <dd>{order.carrier ?? "—"}</dd>
            <dt>Track & trace</dt>
            <dd>
              {order.tracking_url ? (
                <a href={order.tracking_url} target="_blank" rel="noreferrer">
                  Volg zending
                </a>
              ) : (
                "—"
              )}
            </dd>
            <dt>Betaald op</dt>
            <dd>{formatDateTime(order.paid_at)}</dd>
            <dt>Besteld op</dt>
            <dd>{formatDateTime(order.ordered_at)}</dd>
            <dt>Verzonden op</dt>
            <dd>{formatDateTime(order.shipped_at)}</dd>
          </dl>
        </Card>

        {/* Adressen */}
        <Card>
          <h2 className={styles.sectionTitle}>Adressen</h2>
          <h3 className={styles.subheading}>Factuuradres</h3>
          <AddressBlock value={order.billing_address} />
          <h3 className={styles.subheading}>Verzendadres</h3>
          <AddressBlock value={order.shipping_address} />
        </Card>
      </div>

      {/* Regels */}
      <Card>
        <h2 className={styles.sectionTitle}>Orderregels ({items.length})</h2>
        {items.length === 0 ? (
          <p className={styles.muted}>Geen regels.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th className={styles.right}>Aantal</th>
                  <th className={styles.right}>Inkoop</th>
                  <th className={styles.right}>Marge</th>
                  <th className={styles.right}>Regelprijs</th>
                  <th>Configuratie</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.product_name ?? it.probo_product_code}</td>
                    <td>{it.product_type}</td>
                    <td className={styles.right}>{it.amount}</td>
                    <td className={styles.right}>{formatMoney(it.base_price, order.currency)}</td>
                    <td className={styles.right}>{it.markup_pct}%</td>
                    <td className={styles.right}>{formatMoney(it.line_price, order.currency)}</td>
                    <td>
                      <pre className={styles.json}>
                        {JSON.stringify(it.configuration, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Tijdlijn */}
      <Card>
        <h2 className={styles.sectionTitle}>Tijdlijn ({events.length})</h2>
        {events.length === 0 ? (
          <p className={styles.muted}>Nog geen gebeurtenissen.</p>
        ) : (
          <ol className={styles.timeline}>
            {events.map((ev) => (
              <li key={ev.id} className={styles.timelineItem}>
                <div className={styles.timelineTop}>
                  <Badge variant="detail">{ev.source}</Badge>
                  <span className={styles.timelineType}>{ev.event_type}</span>
                  <span className={styles.muted}>{formatDateTime(ev.created_at)}</span>
                </div>
                {ev.payload && (
                  <pre className={styles.json}>{JSON.stringify(ev.payload, null, 2)}</pre>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </section>
  );
}
