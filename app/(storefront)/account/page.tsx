import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Badge, Button, Container, Bag } from "@/components/ui";
import { requireCustomer } from "./auth";
import { logout } from "./actions";
import { listCustomerOrders, getItemsForOrders } from "@/lib/orders/customer";
import { getProduct } from "@/lib/catalog/products";
import type { OrderItemRow } from "@/lib/db/types";
import {
  CUSTOMER_STATUS_LABELS,
  customerStatusVariant,
  formatMoney,
  formatDate,
  isImageUrl,
} from "./format";
import styles from "./account.module.css";

export const metadata: Metadata = {
  title: "Mijn account · Bestellingen",
  description: "Bekijk je bestellingen en bestel snel opnieuw.",
  robots: { index: false, follow: false },
};

// Altijd server-side vers ophalen (geen statische cache van klantdata).
export const dynamic = "force-dynamic";

/** Kies tot 2 thumbnails per order: aangeleverd ontwerp indien beeld, anders producthero. */
function thumbsForOrder(items: OrderItemRow[]): { src: string; alt: string }[] {
  const thumbs: { src: string; alt: string }[] = [];
  for (const it of items) {
    const product = getProduct(it.product_type);
    if (isImageUrl(it.file_url)) {
      thumbs.push({ src: it.file_url as string, alt: `Ontwerp ${it.product_name ?? ""}`.trim() });
    } else if (product?.heroImage) {
      thumbs.push({ src: product.heroImage.src, alt: product.heroImage.alt });
    }
    if (thumbs.length >= 2) break;
  }
  return thumbs;
}

export default async function AccountDashboardPage() {
  const { authUserId, email } = await requireCustomer();
  const orders = await listCustomerOrders({ authUserId, email });

  const items = await getItemsForOrders(orders.map((o) => o.id));
  const itemsByOrder = new Map<string, OrderItemRow[]>();
  for (const it of items) {
    const list = itemsByOrder.get(it.order_id) ?? [];
    list.push(it);
    itemsByOrder.set(it.order_id, list);
  }

  return (
    <Container as="section" className={styles.page}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <Badge variant="success">Mijn account</Badge>
          <h1>Mijn bestellingen</h1>
          <p>Ingelogd als {email}</p>
        </div>
        <form action={logout} className={styles.logoutForm}>
          <Button type="submit" variant="tertiary" size="sm">
            Uitloggen
          </Button>
        </form>
      </div>

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <Bag size={26} />
          </span>
          <h2>Nog geen bestellingen</h2>
          <p>
            Zodra je een duurzame vlag bestelt, vind je hier je bestellingen terug
            en kun je in één klik opnieuw bestellen.
          </p>
          <Button as="a" href="/collectie" size="lg">
            Bekijk de collectie
          </Button>
        </div>
      ) : (
        <div className={styles.orders}>
          {orders.map((order) => {
            const orderItems = itemsByOrder.get(order.id) ?? [];
            const thumbs = thumbsForOrder(orderItems);
            const lineCount = orderItems.length;
            return (
              <Link
                key={order.id}
                href={`/account/bestelling/${order.id}`}
                className={styles.orderCard}
              >
                <div className={styles.orderThumbs} aria-hidden="true">
                  {thumbs.map((t, i) => (
                    <span key={i} className={styles.orderThumb}>
                      <Image
                        src={t.src}
                        alt=""
                        fill
                        sizes="56px"
                        className={styles.orderThumbImg}
                      />
                    </span>
                  ))}
                </div>
                <div className={styles.orderInfo}>
                  <span className={styles.orderNumber}>{order.order_number}</span>
                  <span className={styles.orderMeta}>
                    {formatDate(order.created_at)} · {lineCount}{" "}
                    {lineCount === 1 ? "regel" : "regels"}
                  </span>
                </div>
                <div className={styles.orderRight}>
                  <Badge variant={customerStatusVariant(order.status)}>
                    {CUSTOMER_STATUS_LABELS[order.status]}
                  </Badge>
                  <span className={styles.orderTotal}>
                    {formatMoney(order.total, order.currency)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
