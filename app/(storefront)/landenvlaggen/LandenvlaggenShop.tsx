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

/** Diakriet-ongevoelig zoeken: "curacao" vindt "Curaçao". */
function zoekNorm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function LandenvlaggenShop({ landen }: { landen: Land[] }) {
  const { addItem } = useCart();

  // Populaire landen in vaste volgorde bovenaan, afgeleid uit de server-lijst
  // (zelfde namen als de SSR-HTML, geen eigen Intl-aanroep op de client).
  const populair = POPULAIRE_LAND_CODES.map((code) =>
    landen.find((l) => l.code === code),
  ).filter((l): l is Land => l !== undefined);

  // De mastvlag draagt maten, prijzen en opties; de shop is er een schil
  // omheen. Bestaat hij onverhoopt niet meer, dan rendert de shop niets —
  // beter dan een kapotte bestelknop.
  const product = getProduct("mastvlag");

  const [zoek, setZoek] = useState("");
  const [land, setLand] = useState<Land | null>(null);
  // Aantal per formaat (maatlabel → stuks, default 0): zo bestel je meerdere
  // formaten van één land in één keer.
  const [aantallen, setAantallen] = useState<Record<string, number>>({});
  const [bezig, setBezig] = useState(false);
  const [voortgang, setVoortgang] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [toegevoegd, setToegevoegd] = useState(false);
  const paneelRef = useRef<HTMLDivElement>(null);
  const zoekRef = useRef<HTMLInputElement>(null);

  if (!product) return null;

  const q = zoekNorm(zoek.trim());
  const resultaten = q
    ? landen.filter((l) => zoekNorm(l.naam).includes(q) || l.code === q)
    : landen;

  // Normale mastvlag-defaultopties (eerste keuze per optie), zoals de
  // configurator ze ook voorselecteert: Links, Haken (Clips), Wit.
  const defaultSelections = Object.fromEntries(
    product.options.map((opt) => [opt.label, opt.choices[0]]),
  );

  // Eén regel per formaat; de mand rekent per regel (staffelkorting per
  // regel/aantal, niet over regels of landen heen — bestaande mand-logica).
  const regels = product.sizes.map((size) => ({
    size,
    aantal: aantallen[size.label] ?? 0,
    unitPrice: localUnitPriceWithOptions(product, size, defaultSelections),
  }));
  const gekozen = regels.filter((r) => r.aantal > 0);
  const totaalVlaggen = gekozen.reduce((n, r) => n + r.aantal, 0);
  const totaal = gekozen.reduce(
    (sum, r) => sum + localCartLineTotal(r.unitPrice, r.aantal),
    0,
  );
  const kortingPcts = gekozen
    .map((r) => staffelDiscount(r.aantal))
    .filter((k) => k > 0);

  function zetAantal(label: string, delta: number) {
    setAantallen((prev) => ({
      ...prev,
      [label]: Math.max(0, (prev[label] ?? 0) + delta),
    }));
    setFout(null);
    setToegevoegd(false);
  }

  function kiesLand(l: Land) {
    setLand(l);
    setFout(null);
    setToegevoegd(false);
    setAantallen({});
    // Op mobiel staat het bestelpaneel onder de lijst — even in beeld brengen.
    paneelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /** Succes-vervolg: selectie leeg, terug naar de lijst, zoekveld klaar. */
  function nogEenLand() {
    setLand(null);
    setAantallen({});
    setFout(null);
    setToegevoegd(false);
    setZoek("");
    zoekRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    zoekRef.current?.focus({ preventScroll: true });
  }

  async function bestel() {
    if (!land || !product || bezig) return;
    const teDoen = regels.filter((r) => r.aantal > 0);
    if (teDoen.length === 0) return;
    setBezig(true);
    setFout(null);
    setToegevoegd(false);

    const gelukt: string[] = [];
    const mislukt: string[] = [];
    for (let i = 0; i < teDoen.length; i++) {
      const { size, aantal, unitPrice } = teDoen[i];
      if (teDoen.length > 1) {
        setVoortgang(`Drukbestand ${i + 1} van ${teDoen.length}…`);
      }
      try {
        // Eigen render + upload PER regel, bewust niet één bestand delen:
        // een regel verwijderen in de mand ruimt zijn bestand op
        // (deleteOrphan) en zou anders de andere regels hun bestand afpakken.
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
        gelukt.push(size.label);
        // Gelukte regel meteen op 0: "Probeer opnieuw" doet dan alleen de
        // mislukte formaten over.
        setAantallen((prev) => ({ ...prev, [size.label]: 0 }));
      } catch {
        mislukt.push(size.label);
      }
    }

    setVoortgang(null);
    setBezig(false);
    if (mislukt.length === 0) {
      setToegevoegd(true);
    } else if (gelukt.length === 0) {
      setFout("Dat ging mis. Controleer je verbinding en probeer het opnieuw.");
    } else {
      setFout(
        `In je winkelmand gelukt: ${gelukt.join(" · ")}. Niet gelukt: ${mislukt.join(
          " · ",
        )}. Probeer die opnieuw.`,
      );
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
          ref={zoekRef}
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
              {populair.map((l) => landKnop(l, true))}
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
                Mastvlag van biologisch afbreekbaar doek
              </p>

              {/* Aantal per formaat: meerdere formaten van één land in één
                  bestelling; elk formaat met aantal > 0 wordt een eigen
                  mandregel met een eigen drukbestand. */}
              <fieldset className={styles.veld}>
                <legend className={styles.veldLabel}>Formaat en aantal</legend>
                <div className={styles.maten}>
                  {regels.map(({ size: s, aantal, unitPrice }) => (
                    <div
                      key={s.label}
                      className={styles.maat}
                      data-actief={aantal > 0 || undefined}
                      role="group"
                      aria-label={s.label}
                    >
                      <span className={styles.maatLabel}>{s.label}</span>
                      {s.mastAdvies && (
                        <span className={styles.maatAdvies}>{s.mastAdvies}</span>
                      )}
                      <span className={styles.maatPrijs}>
                        <Price amount={unitPrice} />
                        <span className={styles.maatPerStuk}> per stuk</span>
                      </span>
                      {s.popular && (
                        <span className={styles.maatPopulair}>Meest gekozen</span>
                      )}
                      <span className={styles.maatStepper}>
                        <button
                          type="button"
                          className={styles.stepKnop}
                          disabled={aantal <= 0 || bezig}
                          aria-label={`Minder van ${s.label}`}
                          onClick={() => zetAantal(s.label, -1)}
                        >
                          −
                        </button>
                        <span
                          className={styles.stepWaarde}
                          aria-live="polite"
                          aria-atomic="true"
                        >
                          {aantal}
                        </span>
                        <button
                          type="button"
                          className={styles.stepKnop}
                          disabled={bezig}
                          aria-label={`Meer van ${s.label}`}
                          onClick={() => zetAantal(s.label, 1)}
                        >
                          +
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </fieldset>

              {totaalVlaggen > 0 && (
                <div className={styles.totaalRij}>
                  <span className={styles.totaalLabel}>
                    Totaal
                    {kortingPcts.length === 1 && (
                      <span className={styles.totaalKorting}>
                        incl. {Math.round(kortingPcts[0] * 100)}% staffelkorting
                      </span>
                    )}
                    {kortingPcts.length > 1 && (
                      <span className={styles.totaalKorting}>
                        incl. staffelkorting per formaat
                      </span>
                    )}
                  </span>
                  <span className={styles.totaalBedrag}>
                    <Price amount={totaal} suffix suffixClassName={styles.totaalBtw} />
                  </span>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={bezig}
                disabled={bezig || totaalVlaggen === 0}
                onClick={() => void bestel()}
              >
                {bezig
                  ? gekozen.length > 1
                    ? "Drukbestanden maken…"
                    : "Drukbestand maken…"
                  : totaalVlaggen > 0
                    ? `${totaalVlaggen} ${totaalVlaggen === 1 ? "vlag" : "vlaggen"} in winkelmand`
                    : "In winkelmand"}
              </Button>

              {bezig && (
                <p className={styles.bezigNoot} role="status" aria-live="polite">
                  {voortgang ? `${voortgang} ` : ""}
                  We maken en uploaden{" "}
                  {gekozen.length > 1
                    ? "de drukbestanden van je vlaggen"
                    : "het drukbestand van je vlag"}
                  . Een paar seconden geduld…
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
              {toegevoegd && !bezig && (
                <div className={styles.succesBlok} role="status">
                  <span className={styles.succesIcoon} aria-hidden="true">
                    <Check size={14} />
                  </span>
                  <div className={styles.succesInhoud}>
                    <p className={styles.succesTekst}>Toegevoegd aan winkelmand</p>
                    <button
                      type="button"
                      className={styles.succesActie}
                      onClick={nogEenLand}
                    >
                      Nog een land kiezen
                    </button>
                  </div>
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
