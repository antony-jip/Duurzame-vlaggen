"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import styles from "./afrekenen.module.css";
import {
  Badge,
  Button,
  Card,
  Container,
  Field,
  ArrowRight,
  Leaf,
  ShieldCheck,
  Truck,
  Price,
} from "@/components/ui";
import { useCart } from "@/components/cart/CartProvider";
import { WinkelmandRegel } from "@/components/cart/WinkelmandRegel";
import { toCheckoutLines } from "@/components/cart/types";
import {
  localShipping,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/pricing/local-catalog";
import { checkoutAction } from "./actions";
import { initialCheckoutState } from "./checkout-state";

const COUNTRIES = [
  { code: "NL", label: "Nederland" },
  { code: "BE", label: "België" },
  { code: "DE", label: "Duitsland" },
  { code: "FR", label: "Frankrijk" },
];

/** A reusable Probo-shape address block. */
/**
 * Naam en bedrijfsnaam van één adres. Los, omdat ze bij het VERZENDadres naar
 * Contactgegevens verhuizen: wie je bent is geen adresgegeven. De veldnamen
 * blijven `shipping_first_name` e.d., zodat de server-action, de validatie en
 * het datamodel er niets van merken.
 */
function NaamVelden({
  prefix,
  errors,
  requireCompany,
  values,
}: {
  prefix: string;
  errors: Record<string, string> | undefined;
  requireCompany: boolean;
  values: Record<string, string> | undefined;
}) {
  const err = (name: string) => errors?.[`${prefix}${name}`];
  const val = (name: string) => values?.[`${prefix}${name}`];
  return (
    <>
      <div className={styles.row}>
        <Field
          id={`${prefix}first_name`}
          name={`${prefix}first_name`}
          defaultValue={val("first_name")}
          label="Voornaam"
          autoComplete="given-name"
          required
          errorText={err("first_name")}
        />
        <Field
          id={`${prefix}last_name`}
          name={`${prefix}last_name`}
          defaultValue={val("last_name")}
          label="Achternaam"
          autoComplete="family-name"
          required
          errorText={err("last_name")}
        />
      </div>
      <Field
        id={`${prefix}company_name`}
        name={`${prefix}company_name`}
        defaultValue={val("company_name")}
        label="Bedrijfsnaam"
        autoComplete="organization"
        required={requireCompany}
        errorText={err("company_name")}
      />
    </>
  );
}

function AddressFields({
  prefix,
  errors,
  requireCompany,
  values,
  zonderNaam = false,
}: {
  prefix: string;
  errors: Record<string, string> | undefined;
  requireCompany: boolean;
  /** Wat de klant instuurde; wordt de defaultValue zodat React het niet wist. */
  values: Record<string, string> | undefined;
  /** Naam/bedrijfsnaam overslaan omdat ze elders al gevraagd worden. */
  zonderNaam?: boolean;
}) {
  const err = (name: string) => errors?.[`${prefix}${name}`];
  const val = (name: string) => values?.[`${prefix}${name}`];
  return (
    <>
      {!zonderNaam && (
        <NaamVelden
          prefix={prefix}
          errors={errors}
          requireCompany={requireCompany}
          values={values}
        />
      )}
      <div className={styles.rowThreeOne}>
        <Field
          id={`${prefix}street`}
          name={`${prefix}street`}
          defaultValue={val("street")}
          label="Straat"
          autoComplete="address-line1"
          required
          errorText={err("street")}
        />
        <Field
          id={`${prefix}house_number`}
          name={`${prefix}house_number`}
          defaultValue={val("house_number")}
          label="Huisnr."
          required
          errorText={err("house_number")}
        />
      </div>
      <div className={styles.row}>
        <Field
          id={`${prefix}postal_code`}
          name={`${prefix}postal_code`}
          defaultValue={val("postal_code")}
          label="Postcode"
          autoComplete="postal-code"
          required
          errorText={err("postal_code")}
        />
        <Field
          id={`${prefix}city`}
          name={`${prefix}city`}
          defaultValue={val("city")}
          label="Plaats"
          autoComplete="address-level2"
          required
          errorText={err("city")}
        />
      </div>
      <Field
        as="select"
        id={`${prefix}country`}
        name={`${prefix}country`}
        label="Land"
        defaultValue={val("country") ?? "NL"}
        required
        errorText={err("country")}
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </Field>
    </>
  );
}

export default function AfrekenenPage() {
  const { items, subtotal, hydrated, inclVat, clear } = useCart();
  const [state, formAction, isPending] = useActionState(
    checkoutAction,
    initialCheckoutState,
  );
  const [isBusiness, setIsBusiness] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);

  // A submitted quote request has been received server-side — empty the cart so
  // the customer does not resubmit the same lines.
  useEffect(() => {
    if (state.status === "quote") clear();
  }, [state.status, clear]);

  if (!hydrated) {
    return (
      <Container as="section" className={styles.page}>
        <p className="text-sm">Bezig met laden…</p>
      </Container>
    );
  }

  // After a successful quote submission we still want to show the confirmation
  // banner even though the cart may look full — only block on a truly empty cart
  // when we have nothing to submit and no result yet.
  if (items.length === 0 && state.status !== "quote") {
    return (
      <Container
        as="section"
        className={styles.page}
        aria-labelledby="checkout-title"
      >
        <div className={styles.empty}>
          <span aria-hidden="true">
            <Leaf size={30} />
          </span>
          <h1 id="checkout-title">Je winkelmand is leeg</h1>
          <p className="text-sm">
            Voeg eerst een product toe om af te rekenen.
          </p>
          <Button as="a" href="/collectie" size="lg" icon={<ArrowRight />}>
            Bekijk de collectie
          </Button>
        </div>
      </Container>
    );
  }

  // Dezelfde verzendregel als buildLocalQuote, zodat de pagina niets anders
  // belooft dan er wordt afgerekend. Alles ex btw; Price zet het om.
  const verzending = localShipping(subtotal);
  const tekortVoorGratis = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const gratisVoortgang = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (state.status === "quote") {
    return (
      <Container
        as="section"
        className={styles.page}
        aria-labelledby="checkout-title"
      >
        <div className={styles.empty}>
          <Badge variant="success">Offerte aangevraagd</Badge>
          <h1 id="checkout-title">Bedankt voor je aanvraag</h1>
          <p className="text-sm">{state.message}</p>
          <Button as="a" href="/collectie" size="lg">
            Terug naar de collectie
          </Button>
        </div>
      </Container>
    );
  }

  const quoteOnlyItems = items.filter((it) => it.proboProductCode === null);
  const hasQuoteOnly = quoteOnlyItems.length > 0;
  const quoteOnlyNames = Array.from(
    new Set(quoteOnlyItems.map((it) => it.name)),
  ).join(", ");

  return (
    <Container
      as="section"
      className={styles.page}
      aria-labelledby="checkout-title"
    >
      <div className={styles.head}>
        <Badge variant="success">Afrekenen</Badge>
        <h1 id="checkout-title">Afrekenen</h1>
      </div>

      <div className={styles.layout}>
        <div className={styles.hoofdkolom}>
        <form
          id="checkout-form"
          action={formAction}
          className={styles.form}
          noValidate
        >
          {/* Alleen wat de action uitleest. Hier stond JSON.stringify(items),
              inclusief previewUrl: een base64-PNG tot 3MB die de server nooit
              las. Next kapt action-bodies af op 1MB, dus een foto-zware PDF gaf
              een harde 500 op de betaalknop. */}
          <input
            type="hidden"
            name="items"
            value={JSON.stringify(toCheckoutLines(items))}
          />

          {state.status === "error" && state.message && (
            <p
              className={`${styles.banner} ${styles.bannerError}`}
              role="alert"
            >
              {state.message}
            </p>
          )}

          {/* Contact */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Contactgegevens</legend>
            <Field
              id="email"
              name="email"
              defaultValue={state.values?.email}
              type="email"
              label="E-mailadres"
              autoComplete="email"
              placeholder="naam@bedrijf.nl"
              required
              errorText={state.fieldErrors?.email}
            />
            <Field
              id="phone"
              name="phone"
              defaultValue={state.values?.phone}
              type="tel"
              label="Telefoonnummer"
              autoComplete="tel"
              helperText="Optioneel, voor vragen over je bestelling."
              errorText={state.fieldErrors?.phone}
            />
            {/* Naam en bedrijfsnaam horen bij wie je bent, niet bij waar het
                pakket heen moet. De veldnamen blijven `shipping_*`, zodat de
                server-action en het datamodel ongemoeid blijven. */}
            <NaamVelden
              prefix="shipping_"
              errors={state.fieldErrors}
              requireCompany={isBusiness}
              values={state.values}
            />
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="isBusiness"
                checked={isBusiness}
                onChange={(e) => setIsBusiness(e.target.checked)}
              />
              <span className={styles.toggleLabel}>Ik bestel zakelijk</span>
            </label>
            {isBusiness && (
              <Field
                id="vatNumber"
                name="vatNumber"
                defaultValue={state.values?.vatNumber}
                label="Btw-nummer"
                placeholder="NL123456789B01"
                required
                errorText={state.fieldErrors?.vatNumber}
              />
            )}
          </fieldset>

          {/* Shipping address */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Verzendadres</legend>
            <AddressFields
              prefix="shipping_"
              errors={state.fieldErrors}
              requireCompany={isBusiness}
              values={state.values}
              zonderNaam
            />
          </fieldset>

          {/* Billing address */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Factuuradres</legend>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="sameAsBilling"
                checked={sameAsBilling}
                onChange={(e) => setSameAsBilling(e.target.checked)}
              />
              <span className={styles.toggleLabel}>
                Factuuradres is gelijk aan verzendadres
              </span>
            </label>
            {!sameAsBilling && (
              <AddressFields
                prefix="billing_"
                errors={state.fieldErrors}
                requireCompany={isBusiness}
                values={state.values}
              />
            )}
          </fieldset>
        </form>
        </div>

        {/* Overzicht: alleen geld en betalen. De regels staan hierboven,
            bewerkbaar. */}
        <Card as="aside" className={styles.summary} elevation="raised">
          {/* Je bestelling hoort bij het geld, niet bij het formulier: rechts
              zie je wat je koopt en wat het kost, links vul je in. Zo is de
              hoofdkolom één ononderbroken taak. */}
          <h2 className={styles.zijKop}>Je bestelling</h2>
          <div className={styles.zijRegels}>
            {items.map((item) => (
              <WinkelmandRegel key={item.id} item={item} compact />
            ))}
          </div>

          <h2 className={styles.zijKop}>Overzicht</h2>
          <div className={styles.summaryRow}>
            <span>Subtotaal</span>
            <span>
              <Price amount={subtotal} />
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span>Verzendkosten</span>
            <span>
              {verzending === 0 ? (
                <span className={styles.gratis}>Gratis</span>
              ) : (
                <Price amount={verzending} />
              )}
            </span>
          </div>
          <div className={styles.totaalRij}>
            <span>Totaal</span>
            <strong>
              <Price amount={subtotal + verzending} />
            </strong>
          </div>
          <p className={styles.summaryNote}>
            Prijzen zijn {inclVat ? "inclusief" : "exclusief"} btw.
          </p>

          {/* Gratis-verzending-drempel: zonder dit merkt de klant pas op de
              laatste stap dat hij er net onder zit. */}
          {verzending > 0 ? (
            <div className={styles.gratisNudge}>
              <span>
                Nog <Price amount={tekortVoorGratis} /> en je verzending is gratis
              </span>
              <span
                className={styles.balk}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(gratisVoortgang)}
                aria-label="Voortgang naar gratis verzending"
              >
                <span
                  className={styles.balkVulling}
                  style={{ width: `${gratisVoortgang}%` }}
                />
              </span>
            </div>
          ) : (
            <p className={styles.gratisGehaald}>
              <Leaf size={15} aria-hidden="true" /> Je verzending is gratis.
            </p>
          )}

          {hasQuoteOnly && (
            <p className={`${styles.banner} ${styles.bannerQuote}`}>
              {quoteOnlyNames} {quoteOnlyItems.length > 1 ? "zijn" : "is"} nog
              niet online bestelbaar en blokkeert online afrekenen. Bij
              verzenden ontvangen we je gegevens en sturen we je voor je hele
              winkelmand een offerte.
            </p>
          )}

          <Button
            type="submit"
            form="checkout-form"
            size="lg"
            fullWidth
            loading={isPending}
            icon={<ArrowRight />}
            className={styles.submit}
          >
            {hasQuoteOnly ? "Offerte aanvragen" : "Nu betalen"}
          </Button>
          <ul className={styles.trust}>
            <li>
              <ShieldCheck size={16} aria-hidden="true" /> Veilig betalen via
              iDEAL &amp; Mollie
            </li>
            <li>
              <Leaf size={16} aria-hidden="true" /> CSRD-materiaalpaspoort bij
              elke order
            </li>
            <li>
              <Truck size={16} aria-hidden="true" /> Binnen 5 werkdagen geleverd
            </li>
          </ul>
          <Link href="/collectie" className="text-sm">
            Verder winkelen
          </Link>
        </Card>
      </div>
    </Container>
  );
}
