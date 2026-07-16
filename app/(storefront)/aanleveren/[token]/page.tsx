import type { Metadata } from "next";
import styles from "./portal.module.css";
import { Badge, Container } from "@/components/ui";
import {
  getOrderByPortalToken,
  getOrderDesigns,
  getOrderItems,
  isPortalExpired,
} from "@/lib/orders/repository";
import type { OrderStatus } from "@/lib/db/types";
import { PortalClient, type PortalItem } from "./PortalClient";

/**
 * No-login aanleverportaal. Het [token]-segment is een bearer-credential
 * (onraadbaar, order-gebonden, verloopt 90 dagen na plaatsing), dus deze
 * pagina mag nooit geïndexeerd worden en toont voor onbekende/verlopen tokens
 * een vriendelijk doodlopend eind in plaats van een 404 die de routestructuur
 * verraadt.
 */

export const metadata: Metadata = {
  title: "Ontwerpen aanleveren",
  robots: { index: false, follow: false },
};

/** Statussen waarin de klant nog bestanden mag aanleveren/vervangen. */
const EDITABLE_STATUSES: readonly OrderStatus[] = [
  "awaiting_payment",
  "paid",
  "awaiting_files",
];

/** Vlagafmetingen uit het maatlabel ("250 × 100 cm", ook "Eigen: 245 × 130 cm"). */
function sizeFromLabel(label: string | undefined): {
  widthCm?: number;
  heightCm?: number;
} {
  if (!label) return {};
  const m = /(\d+)\s*[×x]\s*(\d+)\s*cm/i.exec(label);
  if (m) return { widthCm: Number(m[1]), heightCm: Number(m[2]) };
  return {};
}

function DeadEnd({ title, body }: { title: string; body: string }) {
  return (
    <Container as="section" className={styles.page}>
      <div className={styles.deadEnd}>
        <h1>{title}</h1>
        <p className="text-sm">{body}</p>
        <p className="text-sm">
          Hulp nodig? Mail ons via{" "}
          <a href="mailto:hello@duurzame-vlaggen.nl">hello@duurzame-vlaggen.nl</a> met je
          bestelnummer.
        </p>
      </div>
    </Container>
  );
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getOrderByPortalToken(token);

  if (!order) {
    return (
      <DeadEnd
        title="Deze link is niet geldig"
        body="Controleer of je de volledige link uit je bevestigingsmail hebt gebruikt."
      />
    );
  }
  if (isPortalExpired(order)) {
    return (
      <DeadEnd
        title="Deze link is verlopen"
        body="De uploadlink van deze bestelling is niet meer geldig. Neem contact met ons op, dan sturen we je een nieuwe."
      />
    );
  }

  const [items, designs] = await Promise.all([
    getOrderItems(order.id),
    getOrderDesigns(order.id),
  ]);

  const portalItems: PortalItem[] = items.map((it) => {
    const config = (it.configuration ?? {}) as { sizeLabel?: string };
    return {
      id: it.id,
      name: it.product_name ?? it.probo_product_code,
      sizeLabel: config.sizeLabel ?? null,
      amount: it.amount,
      ...sizeFromLabel(config.sizeLabel),
      designs: (designs.get(it.id) ?? []).map((d) => ({
        id: d.id,
        quantity: d.quantity,
        fileUrl: d.file_url,
        fileName: d.file_name,
        warnings: Array.isArray(d.file_warnings)
          ? (d.file_warnings as string[]).filter((w) => typeof w === "string")
          : [],
      })),
    };
  });

  const pending = portalItems.reduce(
    (sum, it) => sum + it.designs.filter((d) => d.fileUrl === null).length,
    0,
  );
  const editable = EDITABLE_STATUSES.includes(order.status);

  return (
    <Container as="section" className={styles.page} aria-labelledby="portal-title">
      <div className={styles.head}>
        <Badge variant="success">Bestelling {order.order_number}</Badge>
        <h1 id="portal-title">
          {editable
            ? pending > 0
              ? "Lever je ontwerpen aan."
              : "Je ontwerpen zijn binnen."
            : "Je bestelling is al besteld."}
        </h1>
        <p className={styles.intro}>
          {editable
            ? pending > 0
              ? `We missen nog ${pending === 1 ? "1 ontwerp" : `${pending} ontwerpen`}. Upload ${pending === 1 ? "het" : "ze"} hieronder; we bestellen je vlaggen zodra alles binnen is. Een al geüpload ontwerp vervangen kan hier ook.`
              : "Alles compleet. Wil je toch nog een ontwerp vervangen? Dat kan hieronder, tot we je bestelling in productie geven."
            : "De bestanden zijn doorgegeven en niet meer te wijzigen. Klopt er iets niet? Reageer op je bevestigingsmail."}
        </p>
      </div>

      <PortalClient token={token} items={portalItems} editable={editable} />
    </Container>
  );
}
