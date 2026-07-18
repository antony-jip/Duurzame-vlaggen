import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "./order.module.css";
import { Bladeren } from "./Bladeren";
import { Badge, Button, Card, Container, Check } from "@/components/ui";
import { getMessages } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/i18n/formatting";
import { countPendingDesigns, getOrderById } from "@/lib/orders/repository";
import { BEDRIJF } from "@/lib/bedrijf";
import type { OrderStatus } from "@/lib/db/types";
import type { Dictionary } from "@/lib/i18n/types";
import type { ProboAddress } from "@/lib/catalog/probo-mapping";

export const metadata: Metadata = {
  title: "Bestelbevestiging",
  robots: { index: false, follow: false },
};

/**
 * De toon van de pagina. Losgetrokken van de statusbadge, want die twee liepen
 * uiteen: de hero riep onvoorwaardelijk "Bedankt voor je bestelling" terwijl de
 * badge eronder "de betaling is mislukt" meldde. Feest vieren over een mislukte
 * betaling is niet alleen raar, het verbergt ook dat de klant nog iets moet.
 */
type Toon = "feest" | "wachten" | "probleem";

function toonVan(status: OrderStatus): Toon {
  switch (status) {
    case "paid":
    case "awaiting_files":
    case "sent_to_probo":
    case "probo_accepted":
    case "in_production":
    case "shipped":
      return "feest";
    case "payment_failed":
    case "probo_rejected":
    case "cancelled":
      return "probleem";
    default:
      return "wachten";
  }
}

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
    case "awaiting_files":
      return { label: s.awaitingFiles, variant: "detail" };
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

/** Kop + onderschrift horen bij de toon, niet bij de losse status. */
function heroCopy(toon: Toon, dict: Dictionary): { title: string; sub: string } {
  const c = dict.order.confirmation;
  if (toon === "probleem") return { title: c.problemTitle, sub: c.problemSubtitle };
  if (toon === "wachten") return { title: c.pendingTitle, sub: c.pendingSubtitle };
  return { title: c.title, sub: c.subtitle };
}

/**
 * De drie stappen na het afrekenen. `staat` bepaalt of een stap af is, nu loopt
 * of nog moet komen — zo ziet de klant meteen waar zijn bestelling staat en
 * wanneer de track & trace-link komt.
 */
type StapStaat = "af" | "bezig" | "wacht";

function stappenVoor(status: OrderStatus): StapStaat[] {
  switch (status) {
    // Betaald, maar de productie kan pas starten als alle ontwerpen binnen
    // zijn — stap 2 staat dus nog op "wacht".
    case "awaiting_files":
      return ["af", "wacht", "wacht"];
    case "paid":
    case "sent_to_probo":
    case "probo_accepted":
      return ["af", "bezig", "wacht"];
    case "in_production":
      return ["af", "bezig", "wacht"];
    case "shipped":
      return ["af", "af", "bezig"];
    default:
      return ["wacht", "wacht", "wacht"];
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
  const toon = toonVan(order.status);
  // Klanten landen hier na de Mollie-redirect; missen er nog ontwerpen, dan is
  // dit hét moment om ze het aanleverportaal in handen te geven.
  const pendingDesigns =
    order.status === "awaiting_files" && order.portal_token
      ? await countPendingDesigns(order.id)
      : 0;
  const hero = heroCopy(toon, dict);
  const shipping = (order.shipping_address ?? null) as ProboAddress | null;
  const stappen = stappenVoor(order.status);
  const s = dict.order.steps;
  const stapCopy = [
    { titel: s.paid, body: s.paidBody },
    { titel: s.production, body: s.productionBody },
    { titel: s.shipped, body: s.shippedBody },
  ];

  return (
    <Container as="section" className={styles.page} aria-labelledby="order-title">
      {toon === "feest" && <Bladeren />}

      <div className={`${styles.hero} ${styles[toon]}`}>
        <span className={styles.checkChip} aria-hidden="true">
          {toon === "probleem" ? <span className={styles.bang}>!</span> : <Check size={32} />}
        </span>
        <span className={styles.orderTag}>
          {dict.order.confirmation.orderNumber} {order.order_number}
        </span>
        <h1 id="order-title" className={styles.heroTitle}>
          {hero.title}
        </h1>
        <p className={styles.heroSub}>{hero.sub}</p>

        {toon === "probleem" && (
          <Button as="a" href="/afrekenen" variant="primary" className={styles.heroCta}>
            {dict.order.confirmation.retryCta}
          </Button>
        )}

        {/* Op rekening: de klant landt hier direct na het plaatsen. De factuur
            met betaallink staat in zijn mail, maar hier direct betalen kan ook,
            met de factuur ernaast als preview (browser-PDF-viewer, incl.
            downloadknop). */}
        {toon === "wachten" && order.mollie_payment_link_url && (
          <div className={styles.heroActies}>
            <Button
              as="a"
              href={order.mollie_payment_link_url}
              variant="primary"
              className={styles.heroCta}
            >
              {dict.order.confirmation.payCta}
            </Button>
            <Button
              as="a"
              href={`/order/${order.id}/factuur`}
              target="_blank"
              rel="noopener"
              variant="secondary"
              className={styles.heroCta}
            >
              {dict.order.confirmation.invoiceView}
            </Button>
          </div>
        )}
      </div>

      {pendingDesigns > 0 && order.portal_token && (
        <Card className={styles.stepsCard} elevation="raised">
          <p className={styles.trackPromise} role="status">
            <span className={styles.trackIcon} aria-hidden="true">
              →
            </span>
            {dict.order.portal.pending.replace("{count}", String(pendingDesigns))}
          </p>
          <div className={styles.actions}>
            <Button as="a" href={`/aanleveren/${order.portal_token}`} variant="primary">
              {dict.order.portal.cta}
            </Button>
          </div>
        </Card>
      )}

      {toon !== "probleem" && (
        <Card className={styles.stepsCard} elevation="raised">
          <h2 className={styles.stepsHeading}>{s.heading}</h2>
          <ol className={styles.steps}>
            {stapCopy.map((stap, i) => (
              <li key={stap.titel} className={`${styles.step} ${styles[stappen[i]]}`}>
                <span className={styles.stepDot} aria-hidden="true">
                  {stappen[i] === "af" ? <Check size={14} /> : i + 1}
                </span>
                <div className={styles.stepText}>
                  <span className={styles.stepTitle}>{stap.titel}</span>
                  <span className={styles.stepBody}>{stap.body}</span>
                </div>
              </li>
            ))}
          </ol>

          <p className={styles.trackPromise}>
            <span className={styles.trackIcon} aria-hidden="true">
              →
            </span>
            {order.tracking_url
              ? dict.order.tracking
              : dict.order.confirmation.trackPromise}
          </p>

          {order.tracking_url && (
            <div className={styles.actions}>
              <Button as="a" href={order.tracking_url} variant="primary">
                {dict.order.tracking}
              </Button>
            </div>
          )}
        </Card>
      )}

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
          {/* Factuur altijd bij de hand zodra er een prijs-snapshot is; ook ná
              betaling wil je hem voor je administratie kunnen pakken. */}
          {order.total != null && toon !== "probleem" && (
            <Button
              as="a"
              href={`/order/${order.id}/factuur?download=1`}
              variant="secondary"
            >
              {dict.order.confirmation.invoiceDownload}
            </Button>
          )}
          <Button as="a" href="/collectie" variant="secondary">
            {dict.common.cta.continueShopping}
          </Button>
        </div>

        {/* Klantcontact in de persoonlijke (sage-purple) kleur, conform de
            styleguide-semantiek: dit is de mens-tot-mens-route. */}
        <p className={styles.contactBlok}>
          {(() => {
            const [voorTel, restNaTel] = dict.order.confirmation.contactPrompt.split("{phone}");
            const [tussen, naMail] = (restNaTel ?? "").split("{email}");
            return (
              <>
                {voorTel}
                <a href={`tel:${BEDRIJF.telefoon.replace(/\s/g, "")}`}>{BEDRIJF.telefoon}</a>
                {tussen}
                <a href={`mailto:${BEDRIJF.email}`}>{BEDRIJF.email}</a>
                {naMail}
              </>
            );
          })()}
        </p>
      </Card>
    </Container>
  );
}
