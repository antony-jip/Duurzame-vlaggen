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
import { ArtworkProof } from "@/components/cart/ArtworkProof";
import { localCartLineTotal } from "@/lib/pricing/local-catalog";
import { checkoutAction, initialCheckoutState } from "./actions";

const COUNTRIES = [
  { code: "NL", label: "Nederland" },
  { code: "BE", label: "België" },
  { code: "DE", label: "Duitsland" },
  { code: "FR", label: "Frankrijk" },
];

/**
 * Flag dimensions for the artwork preview — same fallback as the winkelmand:
 * prefer the fields on the line, else parse the human `sizeLabel` (carts
 * persisted before those fields existed). Returns empty when unknown.
 */
function flagSize(item: {
  widthCm?: number;
  heightCm?: number;
  sizeLabel: string;
}): { widthCm?: number; heightCm?: number } {
  if (item.widthCm && item.heightCm) {
    return { widthCm: item.widthCm, heightCm: item.heightCm };
  }
  const m = /(\d+)\s*[×x]\s*(\d+)\s*cm/i.exec(item.sizeLabel);
  if (m) return { widthCm: Number(m[1]), heightCm: Number(m[2]) };
  return {};
}

/** Is the attached artwork a raster image (vs PDF)? Filename is leading; the
 *  url covers storage links and inline data-URLs (local preview fallback). */
function isImageArtwork(fileName?: string | null, fileUrl?: string | null): boolean {
  return (
    /\.(jpe?g|png)$/i.test(fileName ?? "") ||
    /\.(jpe?g|png)$/i.test(fileUrl ?? "") ||
    /^data:image\//i.test(fileUrl ?? "")
  );
}

/** A reusable Probo-shape address block. */
function AddressFields({
  prefix,
  errors,
  requireCompany,
}: {
  prefix: string;
  errors: Record<string, string> | undefined;
  requireCompany: boolean;
}) {
  const err = (name: string) => errors?.[`${prefix}${name}`];
  return (
    <>
      <Field
        id={`${prefix}company_name`}
        name={`${prefix}company_name`}
        label="Bedrijfsnaam"
        autoComplete="organization"
        required={requireCompany}
        errorText={err("company_name")}
      />
      <div className={styles.row}>
        <Field
          id={`${prefix}first_name`}
          name={`${prefix}first_name`}
          label="Voornaam"
          autoComplete="given-name"
          required
          errorText={err("first_name")}
        />
        <Field
          id={`${prefix}last_name`}
          name={`${prefix}last_name`}
          label="Achternaam"
          autoComplete="family-name"
          required
          errorText={err("last_name")}
        />
      </div>
      <div className={styles.rowThreeOne}>
        <Field
          id={`${prefix}street`}
          name={`${prefix}street`}
          label="Straat"
          autoComplete="address-line1"
          required
          errorText={err("street")}
        />
        <Field
          id={`${prefix}house_number`}
          name={`${prefix}house_number`}
          label="Huisnr."
          required
          errorText={err("house_number")}
        />
      </div>
      <div className={styles.row}>
        <Field
          id={`${prefix}postal_code`}
          name={`${prefix}postal_code`}
          label="Postcode"
          autoComplete="postal-code"
          required
          errorText={err("postal_code")}
        />
        <Field
          id={`${prefix}city`}
          name={`${prefix}city`}
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
        defaultValue="NL"
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
  const { items, subtotal, hydrated, inclVat, clear, updateAmount } = useCart();
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
      <Container as="section" className={styles.page} aria-labelledby="checkout-title">
        <div className={styles.empty}>
          <span aria-hidden="true">
            <Leaf size={30} />
          </span>
          <h1 id="checkout-title">Je winkelmand is leeg</h1>
          <p className="text-sm">Voeg eerst een product toe om af te rekenen.</p>
          <Button as="a" href="/collectie" size="lg" icon={<ArrowRight />}>
            Bekijk de collectie
          </Button>
        </div>
      </Container>
    );
  }

  if (state.status === "quote") {
    return (
      <Container as="section" className={styles.page} aria-labelledby="checkout-title">
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
    <Container as="section" className={styles.page} aria-labelledby="checkout-title">
      <div className={styles.head}>
        <Badge variant="success">Afrekenen</Badge>
        <h1 id="checkout-title">Afrekenen</h1>
      </div>

      <div className={styles.layout}>
        <form
          id="checkout-form"
          action={formAction}
          className={styles.form}
          noValidate
        >
          <input type="hidden" name="items" value={JSON.stringify(items)} />

          {state.status === "error" && state.message && (
            <p className={`${styles.banner} ${styles.bannerError}`} role="alert">
              {state.message}
            </p>
          )}

          {/* Contact */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Contactgegevens</legend>
            <Field
              id="email"
              name="email"
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
              type="tel"
              label="Telefoonnummer"
              autoComplete="tel"
              helperText="Optioneel — voor vragen over je bestelling."
              errorText={state.fieldErrors?.phone}
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
              />
            )}
          </fieldset>
        </form>

        {/* Order summary */}
        <Card as="aside" className={styles.summary} elevation="raised">
          <h2>Overzicht bestelling</h2>
          {items.map((item) => {
            const size = flagSize(item);
            return (
              <div key={item.id} className={styles.summaryLine}>
                <div>
                  {item.name}{" "}
                  <span className={styles.qty}>({item.sizeLabel})</span>
                  {/* Aantal per regel; het verborgen items-veld en het
                      subtotaal rekenen automatisch mee (client component). */}
                  <div
                    className={styles.quantity}
                    role="group"
                    aria-label={`Aantal ${item.name}`}
                  >
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => updateAmount(item.id, item.amount - 1)}
                      disabled={item.amount <= 1}
                      aria-label="Aantal verlagen"
                    >
                      −
                    </button>
                    <span className={styles.qtyValue} aria-live="polite">
                      {item.amount}
                    </span>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => updateAmount(item.id, item.amount + 1)}
                      aria-label="Aantal verhogen"
                    >
                      +
                    </button>
                  </div>
                  {/* Mini-mockup van het aangeleverde ontwerp, op de échte
                      verhouding van deze regel — zelfde render als de
                      winkelmand. Puur weergave. */}
                  {item.fileUrl && size.widthCm && size.heightCm && (
                    <div style={{ marginTop: 4 }}>
                      <ArtworkProof
                        mode="mockup"
                        small
                        src={item.previewUrl ?? item.fileUrl}
                        isImage={
                          !!item.previewUrl ||
                          isImageArtwork(item.fileName, item.fileUrl)
                        }
                        widthCm={size.widthCm}
                        heightCm={size.heightCm}
                        alt={`Je ontwerp op de ${item.name} van ${item.sizeLabel}`}
                      />
                    </div>
                  )}
                </div>
                <span>
                  <Price amount={localCartLineTotal(item.unitPriceEstimate, item.amount)} />
                </span>
              </div>
            );
          })}
          <hr className={styles.summaryDivider} />
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Subtotaal</span>
            <span>
              <Price amount={subtotal} />
            </span>
          </div>
          <p className={styles.summaryNote}>
            Indicatief en {inclVat ? "inclusief" : "exclusief"} btw. Verzendkosten
            en btw worden bij de definitieve bevestiging berekend.
          </p>

          {hasQuoteOnly && (
            <p className={`${styles.banner} ${styles.bannerQuote}`}>
              {quoteOnlyNames} {quoteOnlyItems.length > 1 ? "zijn" : "is"} nog
              niet online bestelbaar en blokkeert online afrekenen. Bij verzenden
              ontvangen we je gegevens en sturen we je voor je hele winkelmand een
              offerte.
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
          <Link href="/winkelwagen" className="text-sm">
            Terug naar winkelmand
          </Link>
        </Card>
      </div>
    </Container>
  );
}
