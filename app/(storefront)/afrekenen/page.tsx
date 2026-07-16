"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
import { cartDesignsComplete, toCheckoutLines } from "@/components/cart/types";
import { getProduct } from "@/lib/catalog/products";
import {
  localShipping,
  ontwerpserviceVoorOrder,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/pricing/local-catalog";
import { checkoutAction } from "./actions";
import { useAdresZoeker, useAdresZoekerBijTypen } from "./useAdresZoeker";
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

  const postcodeRef = useRef<HTMLInputElement>(null);
  const huisnummerRef = useRef<HTMLInputElement>(null);
  const straatRef = useRef<HTMLInputElement>(null);
  const plaatsRef = useRef<HTMLInputElement>(null);
  const [land, setLand] = useState(val("country") ?? "NL");

  // Wat wij zelf hebben ingevuld. Nodig om twee dingen tegelijk waar te maken:
  // je mag altijd handmatig typen (dan blijven jouw woorden staan), én een
  // correctie van de postcode moet de straat wél bijwerken. Zonder dit bleef na
  // "1601MT 115" → De Drie Kronen bij een nieuwe postcode de óude straat staan:
  // het veld was immers niet meer leeg. Een fout bezorgadres, stilletjes.
  const ingevuldRef = useRef<{ straat?: string; plaats?: string }>({});

  const { status, zoek } = useAdresZoeker(({ straat, plaats }) => {
    const magOverschrijven = (
      el: HTMLInputElement | null,
      eerder: string | undefined,
    ) => el && (!el.value || el.value === eerder);

    if (magOverschrijven(straatRef.current, ingevuldRef.current.straat)) {
      straatRef.current!.value = straat;
      ingevuldRef.current.straat = straat;
    }
    if (magOverschrijven(plaatsRef.current, ingevuldRef.current.plaats)) {
      plaatsRef.current!.value = plaats;
      ingevuldRef.current.plaats = plaats;
    }
  });

  function probeerZoeken() {
    void zoek(
      postcodeRef.current?.value ?? "",
      huisnummerRef.current?.value ?? "",
      land,
    );
  }

  // Zodra postcode én huisnummer compleet zijn vult het zichzelf; blur blijft
  // als vangnet voor plakken en autofill.
  const zoekBijTypen = useAdresZoekerBijTypen(zoek);
  function opTypen() {
    zoekBijTypen(
      postcodeRef.current?.value ?? "",
      huisnummerRef.current?.value ?? "",
      land,
    );
  }

  const hulp =
    status === "bezig"
      ? "Adres opzoeken…"
      : status === "gevonden"
        ? "Straat en plaats ingevuld."
        : status === "niet-gevonden"
          ? "Niet gevonden — vul straat en plaats zelf in."
          : undefined;

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
      {/* Land eerst: dat bepaalt of we het adres kunnen opzoeken. Daarna
          postcode + huisnummer, want dáármee vullen straat en plaats zichzelf.
          De oude volgorde begon met straat — dan zit de klant te typen wat hij
          twee velden later cadeau krijgt. */}
      <Field
        as="select"
        id={`${prefix}country`}
        name={`${prefix}country`}
        label="Land"
        defaultValue={val("country") ?? "NL"}
        required
        errorText={err("country")}
        onChange={(e) => setLand(e.currentTarget.value)}
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </Field>
      <div className={styles.rowAdres}>
        <Field
          ref={postcodeRef}
          id={`${prefix}postal_code`}
          name={`${prefix}postal_code`}
          defaultValue={val("postal_code")}
          label="Postcode"
          placeholder="1011 AB"
          autoComplete="postal-code"
          required
          errorText={err("postal_code")}
          onChange={opTypen}
          onBlur={probeerZoeken}
        />
        <Field
          ref={huisnummerRef}
          id={`${prefix}house_number`}
          name={`${prefix}house_number`}
          defaultValue={val("house_number")}
          label="Huisnr."
          required
          errorText={err("house_number")}
          onChange={opTypen}
          onBlur={probeerZoeken}
        />
        {/* Toevoeging hoort bij het huisnummer ("115-A"), niet bij de straat. */}
        <Field
          id={`${prefix}addition`}
          name={`${prefix}addition`}
          defaultValue={val("addition")}
          label="Toev."
          placeholder="A"
          errorText={err("addition")}
        />
      </div>
      {hulp && <p className={styles.adresHulp}>{hulp}</p>}
      <Field
        ref={straatRef}
        id={`${prefix}street`}
        name={`${prefix}street`}
        defaultValue={val("street")}
        label="Straat"
        autoComplete="address-line1"
        required
        errorText={err("street")}
      />
      <Field
        ref={plaatsRef}
        id={`${prefix}city`}
        name={`${prefix}city`}
        defaultValue={val("city")}
        label="Plaats"
        autoComplete="address-level2"
        required
        errorText={err("city")}
      />
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

  // Eenmalige ontwerpservice, met dezelfde regel als buildLocalQuote. Móet hier
  // staan: hij wordt nu wél gefactureerd, en een klant mag nooit €85 afrekenen
  // die hij niet ziet.
  const ontwerpservice = ontwerpserviceVoorOrder(
    items.map((it) => ({
      selections: Object.fromEntries(
        it.options.map((o) => [o.code, String(o.value ?? "")]),
      ),
    })),
  );
  const teBetalen = subtotal + verzending + ontwerpservice;

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
  // Elke bestelbare regel moet zijn volledige aantal gedekt hebben met
  // ontwerpen (uploads of "later aanleveren") vóór er betaald kan worden. De
  // server-action valideert dit opnieuw; dit stuurt alleen de UI.
  const designsComplete = cartDesignsComplete(
    items,
    (slug) => getProduct(slug)?.category === "hardware",
  );

  return (
    <Container
      as="section"
      className={styles.page}
      aria-labelledby="checkout-title"
    >
      <div className={styles.head}>
        <h1 id="checkout-title">Afrekenen</h1>
        {/* Stappenpad: waar je bent en dat betalen de laatste stap is. */}
        <ol className={styles.stappenPad} aria-label="Bestelstappen">
          <li data-done="true">Samenstellen</li>
          <li data-actief="true">Gegevens en ontwerp</li>
          <li>Betalen</li>
        </ol>
        <p className={styles.headSub}>
          <ShieldCheck size={15} aria-hidden="true" />
          Veilig betalen via iDEAL. Binnen 5 werkdagen geleverd.
        </p>
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
              helperText="Hierop ontvang je je orderbevestiging en drukproef."
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
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="noMarketing"
                defaultChecked={state.values?.noMarketing != null}
              />
              <span className={styles.toggleLabel}>
                Ik wil geen vervangingsherinnering per e-mail ontvangen
              </span>
            </label>
            <p className={styles.adresHulp}>
              Zonder vinkje sturen we je na 4 en 8 maanden een herinnering om je
              vlag duurzaam te vervangen. Uitschrijven kan in elke mail met één
              klik.
            </p>
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

        {/* Zijkolom: eerst het geld en de betaalknop (de beslissing), daarna
            de bewerkbare regels. Met meerdere regels stond de knop onder een
            lange scroll; de belangrijkste actie hoort bovenaan. */}
        <Card as="aside" className={styles.summary} elevation="raised">
          <h2 className={styles.zijKop}>Overzicht</h2>
          <div className={styles.summaryRow}>
            <span>
              Subtotaal ({items.reduce((n, it) => n + it.amount, 0)}{" "}
              {items.reduce((n, it) => n + it.amount, 0) === 1
                ? "artikel"
                : "artikelen"}
              )
            </span>
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
          {ontwerpservice > 0 && (
            <div className={styles.summaryRow}>
              <span>Ontwerpservice</span>
              <span>
                <Price amount={ontwerpservice} />
              </span>
            </div>
          )}
          <div className={styles.totaalRij}>
            <span>Totaal</span>
            <strong>
              <Price amount={teBetalen} />
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

          {!hasQuoteOnly && !designsComplete && (
            <p className={`${styles.banner} ${styles.bannerQuote}`} role="status">
              Nog niet elke vlag heeft een ontwerp. Wijs hieronder bij elke
              regel je ontwerpen toe, of kies &ldquo;later aanleveren&rdquo;.
            </p>
          )}

          <Button
            type="submit"
            form="checkout-form"
            size="lg"
            fullWidth
            disabled={!hasQuoteOnly && !designsComplete}
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

          <h2 className={`${styles.zijKop} ${styles.zijKopRegels}`}>
            Je bestelling
          </h2>
          <div className={styles.zijRegels}>
            {items.map((item) => (
              <WinkelmandRegel key={item.id} item={item} compact />
            ))}
          </div>
          <Link href="/collectie" className="text-sm">
            Verder winkelen
          </Link>
        </Card>
      </div>

      {/* Vaste betaalbalk op smalle schermen: totaal en betalen altijd binnen
          handbereik, hoe lang het formulier ook is. */}
      <div className={styles.mobielBalk}>
        <span className={styles.mobielBalkPrijs}>
          <span className={styles.mobielBalkLabel}>Totaal</span>
          <Price amount={teBetalen} />
        </span>
        <Button
          type="submit"
          form="checkout-form"
          disabled={!hasQuoteOnly && !designsComplete}
          loading={isPending}
          icon={<ArrowRight />}
        >
          {hasQuoteOnly ? "Offerte aanvragen" : "Nu betalen"}
        </Button>
      </div>
    </Container>
  );
}
