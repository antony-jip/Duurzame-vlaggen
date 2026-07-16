import type { Metadata } from "next";
import Link from "next/link";
import styles from "./reorder.module.css";
import { Badge, Container } from "@/components/ui";
import {
  getOrderByReorderToken,
  getOrderDesigns,
  getOrderItems,
} from "@/lib/orders/repository";
import { orderItemToCartLine } from "@/lib/orders/reorder";
import { ReorderClient, type ReorderLine } from "./ReorderClient";

/**
 * One-click herbestellen vanuit de lifecycle-mails (4/8 maanden). Het
 * [token]-segment is een langlopende bearer-credential voor één historische
 * order — óók voor gasten zonder account. De regels worden gereconstrueerd via
 * lib/orders/reorder (zelfde module als het klantaccount), inclusief de
 * design-verdeling met verwijzingen naar dezelfde storage-objecten; vervangen
 * kan daarna gewoon in de winkelmand. Prijzen worden live opnieuw berekend, dus
 * een prijswijziging toont zich eerlijk bij het afrekenen.
 */

export const metadata: Metadata = {
  title: "Opnieuw bestellen",
  robots: { index: false, follow: false },
};

export default async function ReorderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getOrderByReorderToken(token);

  if (!order) {
    return (
      <Container as="section" className={styles.page}>
        <div className={styles.deadEnd}>
          <h1>Deze link is niet geldig</h1>
          <p className="text-sm">
            Controleer of je de volledige link uit de e-mail hebt gebruikt.
          </p>
          <p className="text-sm">
            Bestellen kan altijd via <Link href="/collectie">de collectie</Link>, of mail
            ons via{" "}
            <a href="mailto:hello@duurzame-vlaggen.nl">hello@duurzame-vlaggen.nl</a>.
          </p>
        </div>
      </Container>
    );
  }

  const [items, designs] = await Promise.all([
    getOrderItems(order.id),
    getOrderDesigns(order.id),
  ]);

  const lines: ReorderLine[] = items.map((it) => {
    const cartItem = orderItemToCartLine(it, true, designs.get(it.id));
    return {
      reorderable: cartItem !== null,
      name: it.product_name ?? it.probo_product_code,
      sizeLabel: cartItem?.sizeLabel ?? null,
      amount: it.amount,
      designs: (cartItem?.designs ?? []).map((d) => ({
        fileUrl: d.fileUrl,
        fileName: d.fileName,
        quantity: d.quantity,
      })),
      cartItem,
    };
  });

  return (
    <Container as="section" className={styles.page} aria-labelledby="reorder-title">
      <div className={styles.head}>
        <Badge variant="success">Bestelling {order.order_number}</Badge>
        <h1 id="reorder-title">Dezelfde vlag. Twee klikken.</h1>
        <p className={styles.intro}>
          We zetten je vorige bestelling klaar met dezelfde maten en dezelfde
          ontwerpen. Liever een nieuw ontwerp? In de winkelmand vervang je elk
          bestand met één klik. De actuele prijs zie je bij het afrekenen.
        </p>
      </div>

      <ReorderClient lines={lines} />
    </Container>
  );
}
