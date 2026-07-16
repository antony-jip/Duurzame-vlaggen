"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { rasterizePdfSrc } from "@/lib/artwork/preview";
import styles from "./ArtworkProof.module.css";

/**
 * Herbruikbare weergave van een aangeleverd ontwerp op de échte vlagverhouding
 * (widthCm × heightCm):
 *
 * - mode "drukproef": het technische vlagkader met het volledige ontwerp erin,
 *   optioneel met de drie hulplijnen. De insets van de hulplijnen rekenen we
 *   uit échte centimeters om: afloop = 1 cm búiten het eindformaat, veilige
 *   marge = 1 cm erbinnen.
 * - mode "mockup": de realistische vlag aan de mast (mast links, aan de
 *   mastzijde), optioneel wapperend via een SVG-displacement-filter.
 *
 * ZELF-RASTERISEREND: krijgt het component een PDF-bron (isImage=false), dan
 * rasteriseert het de eerste pagina zélf client-side (pdf.js via
 * {@link rasterizePdfSrc}) en toont het resultaat als <img>. Zo krijgt ELKE
 * regel — ook oude cart-regels zonder voorbereide previewUrl — een echt beeld
 * in plaats van een "PDF"-placeholder. Lukt rasteriseren niet (bijv. een dode
 * blob-URL), dan volgt een nette neutrale placeholder; in het grote
 * drukproef-kader (de modal) dient de native <embed> als interim/fallback.
 *
 * Gebruikt door de upload-modal (groot, met controls via `imgStyle`) én als
 * kleine thumbnail op de winkelmandregel en bij afrekenen (`small`), zodat
 * banier, mastvlag, beachvlag en gevelvlag elk hun eigen verhouding tonen. De
 * kleine thumbnail is klikbaar en opent een lightbox met het ontwerp groot
 * ("stel dat mensen nog snel even het design willen checken").
 *
 * Sizing: de aanroeper bepaalt het formaat. Groot: via `className` met een
 * `--cloth-w`/breedte-regel (de modal). Klein: `small` zet een vaste
 * doekhoogte (`--proof-h`, standaard 56px) en laat de breedte uit de
 * verhouding volgen.
 */

export type ArtworkProofMode = "drukproef" | "mockup";

/**
 * Afwerkingszone in de drukproef: waar tunnel, band of ringen op het doek
 * komen (indicatief), afgeleid van de gekozen afwerking op de mandregel. Zo
 * ziet de klant dat zijn logo niet ín de tunnelzoom moet staan — zonder dat we
 * exacte confectiematen beloven.
 */
export interface ProofFinish {
  kind: "tunnel" | "band" | "ringen";
  /** Bevestigingszijde van het doek. */
  side: "links" | "rechts" | "boven";
  /** Legenda-label, bijv. "Tunnelzoom". */
  label: string;
}

/**
 * Doekvorm. Een straightflag-beachvlag is geen rechthoek: de mastzijde loopt
 * op volle hoogte, de bovenrand buigt in een grote curve naar de vrije zijde.
 * De contour is indicatief (het exacte snijpatroon zit in het
 * aanleversjabloon), maar de proef laat zo wél zien wat er buiten het doek
 * valt.
 */
export interface ProofShape {
  kind: "beachStraight";
  side: "links" | "rechts";
}

/**
 * Genormaliseerd straightflag-pad (0..1 in beide assen), naar de vorm van de
 * echte vlag: de vrije zijde (links) loopt op volle hoogte, de top piekt rond
 * een kwart van de breedte en de boog zakt naar de mastzijde (rechts) op ±30%
 * hoogte. Dit is de canonieke stand voor mastzijde RECHTS; voor mastzijde
 * links wordt het pad gespiegeld zodat het boogje aan de mastkant zit.
 */
const BEACH_STRAIGHT_PATH =
  "M 0 1 L 0 0.12 C 0 0.03 0.06 0 0.15 0 L 0.24 0 C 0.62 0 1 0.12 1 0.3 L 1 1 Z";

/**
 * Kromme beachpole (mockup): plant onderaan de mastzijde, loopt langs de
 * korte zijde omhoog en volgt de boog tot de top van de hoge vrije zijde —
 * zoals de echte pole die door de tunnel van de korte kant loopt.
 */
const BEACH_POLE_PATH =
  "M 0.975 1 L 0.975 0.3 C 0.975 0.13 0.62 0.02 0.26 0.02 L 0.16 0.02";

/** Neutrale documentglyph voor de fallback-placeholder (geen "PDF"-tekst). */
function DocGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="42%"
      height="42%"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

/**
 * SVG-displacement-filter dat het vlagdoek laat wapperen — zelfde idee als de
 * homepage-hero (feTurbulence + feDisplacementMap, ademende frequentie via
 * SMIL). Eén vast id: render dus maximaal één wapperende proof tegelijk
 * (in de praktijk alleen de modal; thumbnails wapperen niet).
 */
function FlagWaveFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <filter id="artwork-wave" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.011 0.028"
          numOctaves="2"
          seed="4"
          result="ruis"
        >
          <animate
            attributeName="baseFrequency"
            dur="12s"
            keyTimes="0;0.5;1"
            values="0.011 0.028;0.016 0.021;0.011 0.028"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="ruis"
          scale="11"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}

export function ArtworkProof({
  src,
  isImage,
  widthCm,
  heightCm,
  mode,
  alt,
  fileName,
  small = false,
  wave = false,
  showGuides = false,
  finish,
  shape,
  imgStyle,
  className,
}: {
  /** URL van het ontwerp (storage-URL, data-URL of lokale object-URL). */
  src: string;
  /** true = JPG/PNG (direct als <img>); false = PDF (zelf rasteriseren). */
  isImage: boolean;
  /** Vlagmaat in cm — bepaalt de verhouding van kader/doek. */
  widthCm: number;
  heightCm: number;
  mode: ArtworkProofMode;
  /** Toegankelijke omschrijving van wat er te zien is. */
  alt: string;
  /** Optionele bestandsnaam, getoond als bijschrift in de lightbox. */
  fileName?: string | null;
  /** Compacte thumbnail-variant (winkelmand/afrekenen); wordt klikbaar. */
  small?: boolean;
  /** Wapperende doek-animatie; alleen zinnig op groot formaat (de modal). */
  wave?: boolean;
  /** Hulplijnen eindformaat/afloop/veilige marge (alleen drukproef). */
  showGuides?: boolean;
  /** Afwerkingszone (tunnel/band/ringen) in de drukproef, indicatief. */
  finish?: ProofFinish;
  /** Doekvorm (straightflag-curve); rechthoek wanneer weggelaten. */
  shape?: ProofShape;
  /** Extra stijl voor de beeldlaag (object-fit/rotatie/spiegelen uit de modal). */
  imgStyle?: React.CSSProperties;
  className?: string;
}) {
  // Zelf-rasterisatie: voor een PDF-bron de eerste pagina naar een data-URL.
  const [pdfRaster, setPdfRaster] = useState<string | null>(null);
  const [pdfFailed, setPdfFailed] = useState(false);
  // Beeld faalde te laden (bijv. dode blob-URL) → val terug op placeholder.
  const [imgError, setImgError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Reset + start (async) rasterisatie zodra de bron/soort wijzigt. Dit is de
  // kanonieke "synchroniseer met een externe bron"-effect: het resultaat komt
  // uit fetch + pdf.js, dus state zetten hoort hier thuis (zelfde patroon en
  // scoped rule-disable als in CartProvider).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setImgError(false);
    // Een echte afbeelding renderen we direct; niets te rasteriseren.
    if (isImage) {
      setPdfRaster(null);
      setPdfFailed(false);
      return;
    }
    let cancelled = false;
    setPdfRaster(null);
    setPdfFailed(false);
    void rasterizePdfSrc(src).then((dataUrl) => {
      if (cancelled) return;
      if (dataUrl) setPdfRaster(dataUrl);
      else setPdfFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isImage, src]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Body-scroll lock + Esc-sluiten zolang de lightbox open is.
  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen]);

  // Weergavebron: een echte afbeelding gebruikt src direct; een PDF pas zodra
  // de zelf-rasterisatie klaar is.
  const displaySrc = isImage ? src : pdfRaster;
  const hasImage = displaySrc !== null && !imgError;

  const sizeVars = {
    "--fw": String(widthCm),
    "--fh": String(heightCm),
  } as React.CSSProperties;
  const aspect = `${widthCm} / ${heightCm}`;
  const cx = (...parts: Array<string | false>) =>
    parts.filter(Boolean).join(" ");

  // Straightflag: clip + contourlijnen via één genormaliseerd pad. Het
  // canonieke pad heeft de mast rechts (korte zijde + boog rechts, hoge vrije
  // zijde links); voor mastzijde links spiegelen we in SVG-transformruimte —
  // dan zit het boogje aan de mastkant, zoals op de echte vlag.
  const clipId = useId();
  const beach = shape?.kind === "beachStraight" ? shape : null;
  const beachMirror = beach?.side === "links" ? "translate(1,0) scale(-1,1)" : undefined;
  const beachClip = beach ? (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <clipPath id={clipId} clipPathUnits="objectBoundingBox">
          <path d={BEACH_STRAIGHT_PATH} transform={beachMirror} />
        </clipPath>
      </defs>
    </svg>
  ) : null;
  /** Wikkel media in de doekvorm wanneer die geen rechthoek is. */
  const shaped = (children: React.ReactNode) =>
    beach ? (
      <span className={styles.shapeClip} style={{ clipPath: `url(#${clipId})` }}>
        {children}
      </span>
    ) : (
      children
    );

  const handleImgError = useCallback(() => setImgError(true), []);

  /**
   * De media in het kader/doek: de (gerasterde) afbeelding, anders in het
   * grote drukproef-kader de live <embed> als interim, en anders een nette
   * placeholder — nooit de kale "PDF"-tekst.
   */
  const renderMedia = (imgClass: string) => {
    if (hasImage && displaySrc) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={imgClass}
          style={imgStyle}
          src={displaySrc}
          alt={alt}
          onError={handleImgError}
        />
      );
    }
    // Groot drukproef-kader (modal) terwijl een PDF nog laadt: toon de
    // ingebouwde viewer zodat er meteen iets scherps staat.
    if (!isImage && !small && mode === "drukproef" && !pdfFailed) {
      return (
        <embed
          className={styles.embed}
          src={`${src}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
          type="application/pdf"
          aria-label={alt}
        />
      );
    }
    return (
      <span className={styles.placeholder} role="img" aria-label={alt}>
        <DocGlyph />
      </span>
    );
  };

  const node =
    mode === "drukproef" ? (
      <div
        className={cx(styles.frame, small && styles.small, className ?? false)}
        style={{ ...sizeVars, aspectRatio: aspect }}
      >
        {beachClip}
        {shaped(renderMedia(styles.layer))}
        {showGuides && !beach && (
          <>
            <span className={styles.bleedLine} aria-hidden="true" />
            <span className={styles.cutBorder} aria-hidden="true" />
            <span className={styles.safeMargin} aria-hidden="true" />
          </>
        )}
        {showGuides && beach && (
          // Contourlijnen die de doekvorm volgen: afloop iets buiten, snijlijn
          // op de vorm, veilige marge erbinnen. Non-scaling strokes zodat de
          // lijndikte niet meeschaalt met de vlagverhouding.
          <svg
            className={styles.contour}
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g transform={beachMirror}>
              <path
                d={BEACH_STRAIGHT_PATH}
                className={styles.contourBleed}
                transform="translate(0.5,0.5) scale(1.03) translate(-0.5,-0.5)"
              />
              <path d={BEACH_STRAIGHT_PATH} className={styles.contourCut} />
              <path
                d={BEACH_STRAIGHT_PATH}
                className={styles.contourSafe}
                transform="translate(0.5,0.5) scale(0.95) translate(-0.5,-0.5)"
              />
            </g>
          </svg>
        )}
        {showGuides && finish && !beach && (
          <span
            className={cx(
              styles.finishZone,
              finish.side === "links" && styles.finishLinks,
              finish.side === "rechts" && styles.finishRechts,
              finish.side === "boven" && styles.finishBoven,
              finish.kind === "band" && styles.finishBand,
            )}
            aria-hidden="true"
          >
            {finish.kind === "ringen" && (
              <span className={styles.rings}>
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={styles.ring} />
                ))}
              </span>
            )}
          </span>
        )}
      </div>
    ) : (
      // mode === "mockup": vlag aan de mast. Rechthoekig doek hangt aan een
      // rechte mast; een straightflag hangt aan een beachpole die met de
      // topcurve meebuigt.
      <div
        className={cx(styles.scene, small && styles.small, className ?? false)}
        style={sizeVars}
      >
        {beachClip}
        {wave && <FlagWaveFilter />}
        {!beach && (
          <span className={styles.mast} aria-hidden="true">
            <span className={styles.knob} />
          </span>
        )}
        <div
          className={cx(
            styles.cloth,
            wave && !beach && styles.wave,
            !!beach && styles.beachCloth,
          )}
          style={{ aspectRatio: aspect }}
        >
          {/* Wave-filter op een buitenlaag, clip op de binnenlaag: zo wappert
              de doekrand mee terwijl de pole (los ernaast) stil blijft. */}
          {beach && wave ? (
            <span className={cx(styles.shapeClip, styles.wave)}>
              {shaped(renderMedia(styles.clothImg))}
            </span>
          ) : (
            shaped(renderMedia(styles.clothImg))
          )}
          {beach && (
            <svg
              className={styles.beachPole}
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <g transform={beachMirror}>
                <path d={BEACH_POLE_PATH} />
              </g>
            </svg>
          )}
        </div>
      </div>
    );

  // Alleen de kleine thumbnail is klikbaar (de modal is al groot). We maken
  // hem pas klikbaar zodra er een echt beeld te vergroten valt.
  if (!small || !hasImage) return node;

  const caption = fileName ?? alt;

  return (
    <>
      <button
        type="button"
        className={styles.thumbButton}
        onClick={() => setLightboxOpen(true)}
        aria-label="Bekijk ontwerp groot"
      >
        {node}
      </button>

      {lightboxOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={styles.lightboxBackdrop}
            role="dialog"
            aria-modal="true"
            aria-label="Ontwerp groot bekijken"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setLightboxOpen(false)}
              aria-label="Sluiten"
            >
              ✕
            </button>
            <figure
              className={styles.lightboxFigure}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.lightboxStage} style={{ aspectRatio: aspect }}>
                {displaySrc && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.lightboxImage}
                    src={displaySrc}
                    alt={alt}
                  />
                )}
              </div>
              {caption && (
                <figcaption className={styles.lightboxCaption}>{caption}</figcaption>
              )}
            </figure>
          </div>,
          document.body,
        )}
    </>
  );
}
