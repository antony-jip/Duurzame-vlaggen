"use client";

/**
 * Landenvlaggen-shop: land kiezen → mastvlag-formaat + aantal → in winkelmand.
 *
 * Het bijzondere zit in de koopknop: die rendert de officiële vlag-SVG
 * client-side naar een drukklaar PNG-bestand (lib/landen/render), uploadt dat
 * door het bestaande sign/finalize-pad (lib/artwork/upload) en hangt het als
 * design aan de mastvlag-regel. De klant hoeft dus niets aan te leveren en de
 * rest van de flow (drukproef-mini op de regel, checkout, admin) werkt zoals
 * bij elke andere bestelling.
 */

import { useRef, useState } from "react";
import styles from "./landenvlaggen.module.css";
import { Button, Check, Price } from "@/components/ui";
import { useCart } from "@/components/cart/CartProvider";
import { clientId } from "@/components/cart/types";
import { uploadOne } from "@/lib/artwork/upload";
import {
  alleLanden,
  landSlug,
  POPULAIRE_LAND_CODES,
  vlagSrc,
  type Land,
} from "@/lib/landen/landen";
import { renderLandenvlagPng } from "@/lib/landen/render";
import { getProduct } from "@/lib/catalog/products";
import {
  localCartLineTotal,
  localUnitPriceWithOptions,
  staffelDiscount,
} from "@/lib/pricing/local-catalog";

// Module-scope: één keer opbouwen (SSR én client), niet per render.
const LANDEN = alleLanden();
const POPULAIR = POPULAIRE_LAND_CODES.map((code) =>
  LANDEN.find((l) => l.code === code),
).filter((l): l is Land => l !== undefined);

/** Diakriet-ongevoelig zoeken: "curacao" vindt "Curaçao". */
function zoekNorm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function LandenvlaggenShop() {
  const { addItem } = useCart();

  // De mastvlag draagt maten, prijzen en opties; de shop is er een schil
  // omheen. Bestaat hij onverhoopt niet meer, dan rendert de shop niets —
  // beter dan een kapotte bestelknop.
  const product = getProduct("mastvlag");

  const [zoek, setZoek] = useState("");
  const [land, setLand] = useState<Land | null>(null);
  const [sizeIndex, setSizeIndex] = useState(() =>
    Math.max(0, product?.sizes.findIndex((s) => s.popular) ?? 0),
  );
  const [aantal, setAantal] = useState(1);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const paneelRef = useRef<HTMLDivElement>(null);

  if (!product) return null;

  const q = zoekNorm(zoek.trim());
  const resultaten = q
    ? LANDEN.filter((l) => zoekNorm(l.naam).includes(q) || l.code === q)
    : LANDEN;

  const size = product.sizes[sizeIndex];
  // Normale mastvlag-defaultopties (eerste keuze per optie), zoals de
  // configurator ze ook voorselecteert: Links, Haken (Clips), Wit.
  const defaultSelections = Object.fromEntries(
    product.options.map((opt) => [opt.label, opt.choices[0]]),
  );
  const unitPrice = localUnitPriceWithOptions(product, size, defaultSelections);
  const totaal = localCartLineTotal(unitPrice, aantal);
  const korting = staffelDiscount(aantal);

  function kiesLand(l: Land) {
    setLand(l);
    setFout(null);
    // Op mobiel staat het bestelpaneel onder de lijst — even in beeld brengen.
    paneelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function bestel() {
    if (!land || !product || bezig) return;
    setBezig(true);
    setFout(null);
    try {
      // 1) Officiële vlag → drukklaar PNG (canvas, ≥3000 px breed).
      const bestand = await renderLandenvlagPng(
        land.code,
        `landenvlag-${landSlug(land.naam)}.png`,
        size.widthCm ?? 150,
      );
      // 2) Door het bestaande upload-pad (sign → Storage → finalize).
      const upload = await uploadOne(bestand, {
        widthCm: size.widthCm,
        heightCm: size.heightCm,
      });
      // 3) Als complete mastvlag-regel de mand in, design incluis.
      addItem({
        slug: product.slug,
        name: product.name,
        proboProductCode: product.proboProductCode,
        sizeLabel: size.label,
        widthCm: size.widthCm,
        heightCm: size.heightCm,
        unitPriceEstimate: unitPrice,
        amount: aantal,
        options: [
          { code: "Formaat", value: size.label },
          { code: "Landenvlag", value: land.naam },
          ...product.options.flatMap((opt) => {
            const value = defaultSelections[opt.label];
            return value ? [{ code: opt.label, value }] : [];
          }),
        ],
        designs: [
          {
            id: clientId(),
            quantity: aantal,
            fileUrl: upload.url,
            fileName: upload.name,
            filePath: upload.path,
            // De maatcheck meldt hier standaard dat 4:3 afwijkt van de
            // vlagverhouding — maar dit bestand maken wíj, precies volgens
            // plan (de drukkerij zet de vlag naar de doekmaat). Die
            // waarschuwing zou de klant alleen maar onterecht alarmeren.
            fileWarnings: [],
            previewUrl: null,
          },
        ],
      });
    } catch (err) {
      setFout(
        err instanceof Error && err.message
          ? `Dat ging mis: ${err.message}.`
          : "Dat ging mis. Controleer je verbinding en probeer het opnieuw.",
      );
    } finally {
      setBezig(false);
    }
  }

  // `groot` — de "Veel gekozen"-tegels zijn iets groter met een prominentere
  // vlag, zodat ze zich visueel onderscheiden van de rustige A-Z-lijst.
  function landKnop(l: Land, groot = false) {
    const actief = land?.code === l.code;
    return (
      <button
        key={l.code}
        type="button"
        className={groot ? `${styles.landKnop} ${styles.landKnopGroot}` : styles.landKnop}
        data-actief={actief || undefined}
        onClick={() => kiesLand(l)}
        aria-pressed={actief}
      >
        {/* Statische SVG uit public/ — next/image optimaliseert geen SVG. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={vlagSrc(l.code)}
          alt=""
          width={groot ? 44 : 30}
          height={groot ? 33 : 23}
          loading="lazy"
          className={styles.landVlagje}
        />
        <span className={styles.landNaam}>{l.naam}</span>
        {actief && (
          <span className={styles.landCheck} aria-hidden="true">
            <Check size={13} />
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={styles.shop}>
      {/* Kolom 1 — land kiezen */}
      <section className={styles.kiezer} aria-label="Kies je land">
        <label className={styles.zoekLabel} htmlFor="land-zoek">
          Zoek je land
        </label>
        <input
          id="land-zoek"
          type="text"
          className={styles.zoekVeld}
          placeholder="Bijvoorbeeld Nederland, Frankrijk, Japan…"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          autoComplete="off"
        />

        {!q && (
          <div className={styles.groep}>
            <h2 className={styles.groepTitel}>Veel gekozen</h2>
            <div className={styles.landGridPopulair}>
              {POPULAIR.map((l) => landKnop(l, true))}
            </div>
          </div>
        )}

        <div className={styles.groep}>
          <h2 className={styles.groepTitel}>
            {q ? `Resultaten (${resultaten.length})` : "Alle landen (A tot Z)"}
          </h2>
          {resultaten.length > 0 ? (
            <div className={styles.landGrid}>
              {resultaten.map((l) => landKnop(l))}
            </div>
          ) : (
            <p className={styles.geenResultaat}>
              Geen land gevonden voor &ldquo;{zoek.trim()}&rdquo;. Controleer de
              spelling of zoek op een deel van de naam.
            </p>
          )}
        </div>
      </section>

      {/* Kolom 2 — bestellen */}
      <div className={styles.paneelWrap} ref={paneelRef}>
        <section className={styles.paneel} aria-label="Je bestelling">
          {land ? (
            <>
              {/* Designwens: de gekozen vlag als subtiele achtergrond van het
                  paneel. Puur decoratief (aria-hidden, geen pointer-events);
                  de key laat de laag per land opnieuw infaden. */}
              <div className={styles.paneelAchtergrond} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={land.code}
                  src={vlagSrc(land.code)}
                  alt=""
                  className={styles.paneelAchtergrondVlag}
                />
              </div>
              <div className={styles.previewWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={vlagSrc(land.code)}
                  alt={`Vlag van ${land.naam}`}
                  className={styles.preview}
                />
              </div>
              <h2 className={styles.paneelTitel}>Vlag van {land.naam}</h2>
              <p className={styles.paneelSub}>
                Mastvlag van biologisch afbreekbaar doek · drukbestand maken wij
              </p>

              <fieldset className={styles.veld}>
                <legend className={styles.veldLabel}>Formaat</legend>
                <div className={styles.maten} role="radiogroup" aria-label="Formaat">
                  {product.sizes.map((s, i) => (
                    <label
                      key={s.label}
                      className={styles.maat}
                      data-actief={i === sizeIndex || undefined}
                    >
                      <input
                        type="radio"
                        name="landenvlag-formaat"
                        checked={i === sizeIndex}
                        onChange={() => {
                          setSizeIndex(i);
                          setFout(null);
                        }}
                      />
                      <span className={styles.maatLabel}>{s.label}</span>
                      {s.mastAdvies && (
                        <span className={styles.maatAdvies}>{s.mastAdvies}</span>
                      )}
                      <span className={styles.maatPrijs}>
                        <Price
                          amount={localUnitPriceWithOptions(
                            product,
                            s,
                            defaultSelections,
                          )}
                        />
                      </span>
                      {s.popular && (
                        <span className={styles.maatPopulair}>Meest gekozen</span>
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className={styles.veld}>
                <span className={styles.veldLabel} id="landenvlag-aantal">
                  Aantal
                </span>
                <div
                  className={styles.stepper}
                  role="group"
                  aria-labelledby="landenvlag-aantal"
                >
                  <button
                    type="button"
                    className={styles.stepKnop}
                    disabled={aantal <= 1}
                    aria-label="Minder"
                    onClick={() => {
                      setAantal((v) => Math.max(1, v - 1));
                      setFout(null);
                    }}
                  >
                    −
                  </button>
                  <span className={styles.stepWaarde}>{aantal}</span>
                  <button
                    type="button"
                    className={styles.stepKnop}
                    aria-label="Meer"
                    onClick={() => {
                      setAantal((v) => v + 1);
                      setFout(null);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.totaalRij}>
                <span className={styles.totaalLabel}>
                  Totaal
                  {korting > 0 && (
                    <span className={styles.totaalKorting}>
                      incl. {Math.round(korting * 100)}% staffelkorting
                    </span>
                  )}
                </span>
                <span className={styles.totaalBedrag}>
                  <Price amount={totaal} suffix suffixClassName={styles.totaalBtw} />
                </span>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={bezig}
                disabled={bezig}
                onClick={() => void bestel()}
              >
                {bezig ? "Drukbestand maken…" : "In winkelmand"}
              </Button>

              {bezig && (
                <p className={styles.bezigNoot} role="status" aria-live="polite">
                  We maken en uploaden het drukbestand van je vlag. Een paar
                  seconden geduld…
                </p>
              )}
              {fout && (
                <div className={styles.foutBlok} role="alert">
                  <p className={styles.foutTekst}>{fout}</p>
                  <button
                    type="button"
                    className={styles.foutOpnieuw}
                    onClick={() => void bestel()}
                  >
                    Probeer opnieuw
                  </button>
                </div>
              )}

              <p className={styles.gerustNoot}>
                Wij zetten de officiële vlag automatisch om naar een drukklaar
                bestand. Je hoeft zelf niets aan te leveren.
              </p>
            </>
          ) : (
            <div className={styles.leegPaneel}>
              <span className={styles.leegVlag} aria-hidden="true">
                <svg viewBox="0 0 48 44" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <line x1={8} y1={3} x2={8} y2={41} />
                  <path d="M11 6 H40 C42.5 8.5 42.5 11 40 13.5 C37.5 16 42.5 18.5 40 21 H11 Z" />
                </svg>
              </span>
              <h2 className={styles.paneelTitel}>Kies eerst een land</h2>
              <p className={styles.paneelSub}>
                Klik op een vlag in de lijst. Daarna kies je het formaat en het
                aantal, en leggen wij het drukbestand voor je klaar.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
