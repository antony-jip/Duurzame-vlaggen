import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "./order.module.css";
import { Badge, Button, Card, Container, Check } from "@/components/ui";
import { getMessages } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/i18n/formatting";
import { getOrderById } from "@/lib/orders/repository";
import type { OrderStatus } from "@/lib/db/types";
import type { Dictionary } from "@/lib/i18n/types";
import type { ProboAddress } from "@/lib/probo/products";

export const metadata: Metadata = {
  title: "Bestelbevestiging",
  robots: { index: false, follow: false },
};

/** Map an internal order status onto a customer-facing label + badge tone. */
function statusPresentation(
  status: OrderStatus,
  dict: Dictionary,
): { label: string; variant: "success" | "primary" | "detail" | "outline" } {
  const s = dict.order.status;
  switch (status) {
    case "cart":
    case "awaiting_payment":
      return { label: s.pending, variant: "outline" };
    case "paid":
    case "sent_to_probo":
    case "probo_accepted":
      return { label: s.paid, variant: "success" };
    case "in_production":
      return { label: s.inProduction, variant: "primary" };
    case "shipped":
      return { label: s.shipped, variant: "primary" };
    case "payment_failed":
      return { label: dict.errors.paymentFailed, variant: "detail" };
    case "probo_rejected":
    case "cancelled":
      return { label: s.cancelled, variant: "detail" };
    default:
      return { label: s.pending, variant: "outline" };
  }
}

function AddressSummary({ label, address }: { label: string; address: ProboAddress }) {
  const name = [address.first_name, address.last_name].filter(Boolean).join(" ");
  const line = [address.street, address.house_number, address.addition]
    .filter(Boolean)
    .join(" ");
  const city = [address.postal_code, address.city].filter(Boolean).join(" ");
  return (
    <div className={styles.addressBlock}>
      <div className={styles.cellLabel}>{label}</div>
      {address.company_name && <div>{address.company_name}</div>}
      {name && <div>{name}</div>}
      {line && <div>{line}</div>}
      {city && <div>{city}</div>}
      {address.country && <div>{address.country}</div>}
    </div>
  );
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const { catalog, dict } = await getMessages();
  const status = statusPresentation(order.status, dict);
  const shipping = (order.shipping_address ?? null) as ProboAddress | null;

  return (
    <Container as="section" className={styles.page} aria-labelledby="order-title">
      <div className={styles.head}>
        <Badge variant="success" icon={<Check size={14} />}>
          {dict.order.confirmation.orderNumber} {order.order_number}
        </Badge>
        <h1 id="order-title">{dict.order.confirmation.title}</h1>
        <p className="lead">{dict.order.confirmation.subtitle}</p>
      </div>

      <Card className={styles.card} elevation="raised">
        <div className={styles.grid}>
          <div className={styles.cell}>
            <span className={styles.cellLabel}>
              {dict.order.confirmation.orderNumber}
            </span>
            <span className={styles.cellValue}>{order.order_number}</span>
          </div>
          <div className={styles.cell}>
            <span className={styles.cellLabel}>Status</span>
            <span className={styles.cellValue}>
              <Badge variant={status.variant}>{status.label}</Badge>
            </span>
          </div>
          <div className={styles.cell}>
            <span className={styles.cellLabel}>Besteldatum</span>
            <span className={styles.cellValue}>
              {formatDate(order.created_at, catalog)}
            </span>
          </div>
          <div className={styles.cell}>
            <span className={styles.cellLabel}>{dict.checkout.email}</span>
            <span className={styles.cellValue}>{order.email}</span>
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.grid}>
          <div className={`${styles.cell} ${styles.total}`}>
            <span className={styles.cellLabel}>
              {dict.checkout.total} ({dict.product.inclVat})
            </span>
            <span className={styles.cellValue}>
              {order.total != null
                ? formatCurrency(order.total, catalog, order.currency)
                : "—"}
            </span>
          </div>
          {shipping && (
            <AddressSummary
              label={dict.checkout.shippingAddress}
              address={shipping}
            />
          )}
        </div>

        <p className="text-sm">
          {dict.order.confirmation.emailSent.replace("{email}", order.email)}
        </p>

        <div className={styles.actions}>
          <Button as="a" href="/collectie" variant="secondary">
            {dict.common.cta.continueShopping}
          </Button>
        </div>
      </Card>
    </Container>
  );
}
