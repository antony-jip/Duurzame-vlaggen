import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { getOrderById, getOrderItems } from "@/lib/orders/repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ALLOWED_TRANSITIONS } from "@/lib/orders/state-machine";
import type { OrderEventRow, OrderStatus } from "@/lib/db/types";
import { STATUS_LABELS, formatMoney, formatDateTime } from "../../../format";
import { requireAdminPage } from "../../../auth";
import {
  refreshPaymentAction,
  advanceStatusAction,
  markeerBesteldAction,
  markeerVerzondenAction,
} from "./actions";
import styles from "../../admin.module.css";

export const metadata: Metadata = {
  title: "Orderdetail · Admin",
  robots: { index: false, follow: false },
};

/**
 * Probo's bestelportaal. We bestellen met de hand (FULFILMENT_MODE "manual"),
 * dus dit is een gewone link — geen API-call.
 */
const PROBO_PORTAAL_URL = "https://www.proboprints.com/";

/**
 * Statussen die de drie fulfilment-stappen NIET dekken (annuleren, betaling
 * mislukt). Die horen als losse knop, zodat de hoofdflow drie stappen blijft.
 */
const STAP_STATUSSEN = new Set<OrderStatus>(["sent_to_probo", "shipped"]);

/**
 * Semantic status pill — mirrors the palette used in the orders table so the
 * colour language stays identical across the back-office (sage-blue = wachtend,
 * forest = onderweg, forest-vol = afgerond, gedempt copper = aandacht).
 */
const STATUS_TONE: Record<OrderStatus, string> = {
  cart: styles.pillNeutral,
  awaiting_payment: styles.pillWait,
  paid: styles.pillProgress,
  sent_to_probo: styles.pillProgress,
  probo_accepted: styles.pillProgress,
  in_production: styles.pillProgress,
  shipped: styles.pillDone,
  payment_failed: styles.pillError,
  probo_rejected: styles.pillError,
  cancelled: styles.pillError,
};

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`${styles.pill} ${STATUS_TONE[status]}`}>
      <span className={styles.pillDot} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}

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
  const overigeStatussen = nextStatuses.filter((s) => !STAP_STATUSSEN.has(s));

  // De drie stappen leiden we af uit de status, niet uit losse vlaggen: de
  // statusmachine is de bron van waarheid.
  const betaald =
    Boolean(order.paid_at) ||
    (["paid", "sent_to_probo", "probo_accepted", "in_production", "shipped"] as OrderStatus[]).includes(
      order.status,
    );
  const besteld = (
    ["sent_to_probo", "probo_accepted", "in_production", "shipped"] as OrderStatus[]
  ).includes(order.status);
  const verzonden = order.status === "shipped";

  return (
    <section className={styles.detail}>
      <div className={styles.detailHead}>
        <div>
          <Link href="/admin" className={styles.backLink}>
            ← Terug naar orders
          </Link>
          <h1 className={styles.pageTitle}>{order.order_number}</h1>
          <div className={styles.detailMeta}>
            <StatusPill status={order.status} />
            <span className={styles.muted}>{formatDateTime(order.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Documenten + betaling. De Probo-API-knoppen zijn hier weg: we bestellen
          handmatig (FULFILMENT_MODE "manual"). Zie het Fulfilment-blok hieronder. */}
      <Card className={styles.actions}>
        <h2 className={styles.sectionTitle}>Documenten</h2>
        <div className={styles.actionRow}>
          {order.mollie_payment_id && (
            <form action={refreshPaymentAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <Button type="submit" size="sm" variant="secondary">
                Ververs betaling
              </Button>
            </form>
          )}
          <Button
            as="a"
            href={`/api/admin/pakbon/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="secondary"
          >
            Pakbon (PDF)
          </Button>
          <Button
            as="a"
            href={`/api/admin/factuur/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="secondary"
          >
            Factuur (PDF)
          </Button>
          <Button
            as="a"
            href={`/api/admin/materiaalpaspoort/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="secondary"
          >
            Materiaalpaspoort (PDF)
          </Button>
        </div>
      </Card>

      {/* Fulfilment — de handbediening. We bestellen zelf in het Probo-portaal,
          dus er is geen callback die de order verder duwt. */}
      <Card className={styles.actions}>
        <div className={styles.fulfilKop}>
          <h2 className={styles.sectionTitle}>Fulfilment</h2>
          <Button
            as="a"
            href={PROBO_PORTAAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
          >
            Bestellen bij Probo →
          </Button>
        </div>

        <ol className={styles.stappen}>
          <li className={betaald ? styles.stapAf : styles.stapOpen}>
            <span className={styles.stapDot} aria-hidden="true" />
            <span className={styles.stapLabel}>Betaald</span>
            {order.paid_at && (
              <span className={styles.muted}>{formatDateTime(order.paid_at)}</span>
            )}
          </li>

          <li className={besteld ? styles.stapAf : styles.stapOpen}>
            <span className={styles.stapDot} aria-hidden="true" />
            <span className={styles.stapLabel}>Besteld bij Probo</span>
            {order.ordered_at && (
              <span className={styles.muted}>{formatDateTime(order.ordered_at)}</span>
            )}
            {betaald && !verzonden && (
              <form action={markeerBesteldAction} className={styles.stapForm}>
                <input type="hidden" name="orderId" value={order.id} />
                <input
                  type="url"
                  name="trackingUrl"
                  className={styles.trackInput}
                  placeholder="Plak de Probo track & trace-link…"
                  defaultValue={order.tracking_url ?? ""}
                />
                <Button type="submit" size="sm" variant="secondary">
                  {besteld ? "Link bijwerken" : "Markeer besteld"}
                </Button>
              </form>
            )}
          </li>

          <li className={verzonden ? styles.stapAf : styles.stapOpen}>
            <span className={styles.stapDot} aria-hidden="true" />
            <span className={styles.stapLabel}>Verzonden</span>
            {order.shipped_at && (
              <span className={styles.muted}>{formatDateTime(order.shipped_at)}</span>
            )}
            {besteld && !verzonden && (
              <form action={markeerVerzondenAction} className={styles.stapForm}>
                <input type="hidden" name="orderId" value={order.id} />
                <Button type="submit" size="sm" variant="secondary">
                  Markeer verzonden
                </Button>
              </form>
            )}
          </li>
        </ol>

        {order.tracking_url && (
          <p className={styles.trackRegel}>
            Track &amp; trace:{" "}
            <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
              {order.tracking_url}
            </a>
          </p>
        )}

        {/* De statusmachine blijft leidend; deze knoppen zijn de uitweg voor de
            randgevallen (annuleren, betaling mislukt) die de drie stappen niet
            dekken. */}
        {overigeStatussen.length > 0 && (
          <div className={styles.actionRow}>
            {overigeStatussen.map((to) => (
              <form action={advanceStatusAction} key={to}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="to" value={to} />
                <Button type="submit" size="sm" variant="tertiary">
                  → {STATUS_LABELS[to]}
                </Button>
              </form>
            ))}
          </div>
        )}
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
                  <th>Ontwerp</th>
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
                      {it.file_url ? (
                        <div className={styles.artworkBlok}>
                          {/(\.png|\.jpe?g|\.webp)$/i.test(it.file_url) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={it.file_url}
                              alt="Aangeleverd ontwerp"
                              className={styles.artworkThumb}
                            />
                          ) : (
                            <span className={styles.artworkDoc} aria-hidden="true">
                              PDF
                            </span>
                          )}
                          <div>
                            {/* `download` forceert opslaan i.p.v. openen: dit
                                bestand moet naar de studio, niet naar een tab. */}
                            <a
                              href={it.file_url}
                              download
                              className={styles.artworkLink}
                              title="Aangeleverd ontwerp downloaden"
                            >
                              Ontwerp downloaden
                            </a>
                            <span className={styles.artworkNaam}>
                              {decodeURIComponent(it.file_url.split("/").pop() ?? "")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>
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
