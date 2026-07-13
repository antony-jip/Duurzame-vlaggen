import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { listOrders } from "@/lib/orders/repository";
import type { OrderStatus } from "@/lib/db/types";
import { STATUS_LABELS, statusBadgeVariant, formatMoney, formatDateTime } from "../format";
import { requireAdminPage } from "../auth";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Orders · Admin",
  robots: { index: false, follow: false },
};

/** Quick-filter tabs shown above the table. */
const FILTERS: { key: string; label: string; status?: OrderStatus }[] = [
  { key: "all", label: "Alle" },
  { key: "awaiting_payment", label: "Wacht op betaling", status: "awaiting_payment" },
  { key: "paid", label: "Betaald", status: "paid" },
  { key: "sent_to_probo", label: "Naar Probo", status: "sent_to_probo" },
  { key: "probo_accepted", label: "Probo akkoord", status: "probo_accepted" },
  { key: "in_production", label: "In productie", status: "in_production" },
  { key: "shipped", label: "Verzonden", status: "shipped" },
  { key: "payment_failed", label: "Betaling mislukt", status: "payment_failed" },
  { key: "probo_rejected", label: "Probo afgewezen", status: "probo_rejected" },
  { key: "cancelled", label: "Geannuleerd", status: "cancelled" },
];

const VALID_STATUSES = new Set<OrderStatus>(
  FILTERS.map((f) => f.status).filter((s): s is OrderStatus => Boolean(s)),
);

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminPage();
  const { status: rawStatus } = await searchParams;
  const active =
    rawStatus && VALID_STATUSES.has(rawStatus as OrderStatus) ? (rawStatus as OrderStatus) : null;

  // KPIs are always computed over ALL orders; the table honours the filter.
  const allOrders = await listOrders();
  const orders = active ? allOrders.filter((o) => o.status === active) : allOrders;

  const openCount = allOrders.filter((o) =>
    ["awaiting_payment", "paid", "sent_to_probo", "probo_accepted", "in_production"].includes(
      o.status,
    ),
  ).length;
  const shippedCount = allOrders.filter((o) => o.status === "shipped").length;

  return (
    <section>
      <h1 className={styles.pageTitle}>Orders</h1>

      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <span className={styles.kpiValue}>{allOrders.length}</span>
          <span className={styles.kpiLabel}>Orders totaal</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiValue}>{openCount}</span>
          <span className={styles.kpiLabel}>Openstaand</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiValue}>{shippedCount}</span>
          <span className={styles.kpiLabel}>Verzonden</span>
        </div>
      </div>

      <nav className={styles.filters} aria-label="Filter op status">
        {FILTERS.map((f) => {
          const isActive = f.status ? active === f.status : active === null;
          const href = f.status ? `/admin?status=${f.status}` : "/admin";
          return (
            <Link
              key={f.key}
              href={href}
              className={`${styles.filter} ${isActive ? styles.filterActive : ""}`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <p className={styles.empty}>Geen orders gevonden.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Datum</th>
                <th>Status</th>
                <th>Markt</th>
                <th>E-mail</th>
                <th className={styles.right}>Totaal</th>
                <th>Mollie</th>
                <th>Probo</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className={styles.row}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className={styles.orderLink}>
                      {o.order_number}
                    </Link>
                  </td>
                  <td className={styles.nowrap}>{formatDateTime(o.created_at)}</td>
                  <td>
                    <Badge variant={statusBadgeVariant(o.status)}>
                      {STATUS_LABELS[o.status]}
                    </Badge>
                  </td>
                  <td className={styles.upper}>{o.market}</td>
                  <td>{o.email}</td>
                  <td className={styles.right}>{formatMoney(o.total, o.currency)}</td>
                  <td className={styles.muted}>{o.mollie_status ?? "—"}</td>
                  <td className={styles.muted}>{o.probo_status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
