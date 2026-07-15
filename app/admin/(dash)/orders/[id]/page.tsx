import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { getOrderById, getOrderItems } from "@/lib/orders/repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ALLOWED_TRANSITIONS } from "@/lib/orders/state-machine";
import type { OrderEventRow, OrderStatus } from "@/lib/db/types";
import type { ProboAddress } from "@/lib/catalog/probo-mapping";
import { STATUS_LABELS, formatMoney, formatDateTime } from "../../../format";
import { requireAdminPage } from "../../../auth";
import {
  refreshPaymentAction,
  advanceStatusAction,
  markeerBesteldAction,
  markeerVerzondenAction,
} from "./actions";
import { MailKlant } from "./MailKlant";
import { ProboLijst } from "./ProboLijst";
import { OntwerpPreview } from "./OntwerpPreview";
import { isEmailConfigured } from "@/lib/email/client";
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

const LANDEN: Record<string, string> = {
  NL: "Nederland",
  BE: "België",
  DE: "Duitsland",
  FR: "Frankrijk",
};

/** "1601MT" → "1601 MT"; laat al-correcte en buitenlandse codes met rust. */
function postcode(waarde: string): string {
  const nl = /^(\d{4})\s*([A-Za-z]{2})$/.exec(waarde.trim());
  return nl ? `${nl[1]} ${nl[2].toUpperCase()}` : waarde;
}

/**
 * Een adres zoals je het op een envelop schrijft. Dit dumpte eerst
 * `Object.entries` van de JSONB, dus stond er letterlijk `house_number` en
 * `postal_code` in beeld, in de volgorde waarin Postgres de sleutels teruggaf.
 */
function AddressBlock({ value }: { value: unknown }) {
  if (!value || typeof value !== "object") return <span className={styles.muted}>—</span>;
  const a = value as ProboAddress;

  const naam = [a.first_name, a.last_name].filter(Boolean).join(" ");
  const straat = [a.street, a.house_number, a.addition].filter(Boolean).join(" ");
  const plaats = [a.postal_code ? postcode(a.postal_code) : null, a.city]
    .filter(Boolean)
    .join("  ");
  const land = a.country ? (LANDEN[a.country.toUpperCase()] ?? a.country) : null;

  const regels = [a.company_name, naam, straat, plaats, land].filter(Boolean);
  if (regels.length === 0) return <span className={styles.muted}>—</span>;

  return (
    <address className={styles.address}>
      {regels.map((regel, i) => (
        <span key={i}>{regel}</span>
      ))}
    </address>
  );
}

/** Twee adressen zijn gelijk als elk veld gelijk is — dan hoeft er maar één. */
function zelfdeAdres(a: unknown, b: unknown): boolean {
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const velden: Array<keyof ProboAddress> = [
    "company_name",
    "first_name",
    "last_name",
    "street",
    "house_number",
    "addition",
    "postal_code",
    "city",
    "country",
  ];
  const x = a as ProboAddress;
  const y = b as ProboAddress;
  return velden.every((v) => (x[v] ?? "") === (y[v] ?? ""));
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

      {/* Twee kolommen i.p.v. zes volle-breedte kaarten onder elkaar. Links het
          werk: waaraan je ziet wat je moet inkopen. Rechts, meelopend, de
          bediening en de samenvatting — die raadpleeg je terwijl je links bezig
          bent, dus die mag niet wegscrollen. */}
      <div className={styles.dash}>
        <div className={styles.dashMain}>
      <Card>
        <h2 className={styles.sectionTitle}>Orderregels ({items.length})</h2>
        {items.length === 0 ? (
          <p className={styles.muted}>Geen regels.</p>
        ) : (
          <div className={styles.regels}>
            {items.map((it) => (
              <article key={it.id} className={styles.regel}>
                <header className={styles.regelKop}>
                  <div className={styles.regelTitel}>
                    <span className={styles.regelNaam}>
                      {it.product_name ?? it.probo_product_code}
                    </span>
                    <span className={styles.regelType}>{it.product_type}</span>
                  </div>
                  <span className={styles.regelAantal}>{it.amount}×</span>
                </header>

                <div className={styles.regelBody}>
                  <div className={styles.regelZij}>
                    <span className={styles.proboLabel}>Ontwerp</span>
                    {it.file_url ? (
                      <div className={styles.artworkBlok}>
                        <OntwerpPreview fileUrl={it.file_url} />
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
                      <span className={styles.muted}>Geen bestand aangeleverd</span>
                    )}

                    <dl className={styles.regelBedragen}>
                      <div>
                        <dt>Inkoop</dt>
                        <dd>{formatMoney(it.base_price, order.currency)}</dd>
                      </div>
                      <div>
                        <dt>Marge</dt>
                        <dd>{it.markup_pct}%</dd>
                      </div>
                      <div>
                        <dt>Regelprijs</dt>
                        <dd className={styles.regelPrijs}>
                          {formatMoney(it.line_price, order.currency)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <ProboLijst configuration={it.configuration} aantal={it.amount} />
                </div>
              </article>
            ))}
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
        </div>

        <aside className={styles.dashZij}>
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

      {/* Mail de klant — expliciete actie, dus met zichtbare uitkomst. */}
      <Card className={styles.actions}>
        <MailKlant
          orderId={order.id}
          email={order.email}
          mailIngesteld={isEmailConfigured()}
        />
      </Card>

      {/* Eén overzicht in plaats van vier losse blokken. Alles wat altijd leeg is
          staat er niet meer in: `probo_order_id` en `probo_status` worden sinds
          het verwijderen van de API-koppeling nergens meer geschreven, en
          `carrier` evenmin — dat waren dus permanente streepjes. De btw-regels
          verschijnen alleen bij een zakelijke order, want bij een particulier
          zeggen ze niets. */}
      <Card>
        <h2 className={styles.sectionTitle}>Overzicht</h2>
        <div className={styles.overzicht}>
          <section className={styles.overzichtKolom}>
            <h3 className={styles.subheading}>Klant</h3>
            <dl className={styles.dl}>
              <dt>E-mail</dt>
              <dd>
                <a href={`mailto:${order.email}`}>{order.email}</a>
              </dd>
              {order.phone && (
                <>
                  <dt>Telefoon</dt>
                  <dd>
                    <a href={`tel:${order.phone}`}>{order.phone}</a>
                  </dd>
                </>
              )}
              {order.is_business && (
                <>
                  <dt>Btw-nummer</dt>
                  <dd>
                    {order.vat_number ?? "—"}
                    {order.vat_number_valid === true && " (geldig)"}
                    {order.vat_number_valid === false && " (ongeldig)"}
                  </dd>
                  {order.reverse_charge && (
                    <>
                      <dt>Btw</dt>
                      <dd>Verlegd</dd>
                    </>
                  )}
                </>
              )}
            </dl>

            <h3 className={styles.subheading}>Verzendadres</h3>
            <AddressBlock value={order.shipping_address} />

            <h3 className={styles.subheading}>Factuuradres</h3>
            {zelfdeAdres(order.billing_address, order.shipping_address) ? (
              <span className={styles.muted}>Gelijk aan verzendadres</span>
            ) : (
              <AddressBlock value={order.billing_address} />
            )}
          </section>

          <section className={styles.overzichtKolom}>
            <h3 className={styles.subheading}>Bedragen</h3>
            <dl className={styles.dl}>
              <dt>Subtotaal (excl. btw)</dt>
              <dd>{formatMoney(order.subtotal_ex_vat, order.currency)}</dd>
              <dt>Verzendkosten</dt>
              <dd>{formatMoney(order.shipping_cost, order.currency)}</dd>
              <dt>Btw{order.vat_rate !== null ? ` (${order.vat_rate}%)` : ""}</dt>
              <dd>{formatMoney(order.vat_amount, order.currency)}</dd>
            </dl>
            <div className={styles.totaalRegel}>
              <span>Totaal</span>
              <strong>{formatMoney(order.total, order.currency)}</strong>
            </div>
          </section>

          <section className={styles.overzichtKolom}>
            <h3 className={styles.subheading}>Betaling &amp; fulfilment</h3>
            <dl className={styles.dl}>
              <dt>Betaling</dt>
              <dd>{order.mollie_status ?? "—"}</dd>
              {order.paid_at && (
                <>
                  <dt>Betaald op</dt>
                  <dd>{formatDateTime(order.paid_at)}</dd>
                </>
              )}
              {order.ordered_at && (
                <>
                  <dt>Besteld op</dt>
                  <dd>{formatDateTime(order.ordered_at)}</dd>
                </>
              )}
              {order.shipped_at && (
                <>
                  <dt>Verzonden op</dt>
                  <dd>{formatDateTime(order.shipped_at)}</dd>
                </>
              )}
              {order.tracking_url && (
                <>
                  <dt>Track &amp; trace</dt>
                  <dd>
                    <a href={order.tracking_url} target="_blank" rel="noreferrer">
                      Volg zending
                    </a>
                  </dd>
                </>
              )}
              <dt>Markt</dt>
              <dd className={styles.upper}>{order.market}</dd>
            </dl>
            {order.mollie_payment_id && (
              <span className={styles.mollieId}>{order.mollie_payment_id}</span>
            )}
          </section>
        </div>
      </Card>
        </aside>
      </div>
    </section>
  );
}
