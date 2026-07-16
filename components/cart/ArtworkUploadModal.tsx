"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { sniffKind } from "@/lib/artwork/sniff";
import {
  analyzeBytes,
  buildWarnings,
  type ArtworkInfo,
  type FlagSize,
} from "@/lib/artwork/inspect";
import {
  rasterizeImageElement,
  rasterizePdfFirstPage,
  rasterizePdfSrc,
} from "@/lib/artwork/preview";
import { ArtworkProof, type ProofFinish } from "./ArtworkProof";
import type { CartDesign } from "./types";
import styles from "./ArtworkUpload.module.css";

/**
 * Pop-up (native <dialog>) upload experience voor het ontwerp van één regel.
 *
 * LIVE DRUKPROEF: zodra de klant een bestand kiest tonen we direct een grote,
 * beeldvullende drukproef vanuit het lokale bestand (`URL.createObjectURL`) op
 * de exacte vlagverhouding. Het VOLLEDIGE bestand is altijd zichtbaar
 * (afbeeldingen: object-fit contain; PDF: de eerste pagina, via pdf.js
 * gerasterd naar een compacte preview-afbeelding, met de native <embed> als
 * fallback zolang/als het rasteren niet lukt),
 * met drie hulplijnen eroverheen: eindformaat (doorgetrokken zwart, de
 * vlagmaat), afloop (doorgetrokken terracotta, exact 1 cm búiten het
 * eindformaat) en veilige marge (gestippeld, 1 cm erbinnen) — beide in échte
 * cm omgerekend naar de vlagmaat. Het benodigde aanleverformaat is dus
 * vlagmaat + 2 cm (1 cm afloop rondom); de sidebar toont dat naast de
 * vlagmaat, plus DPI en live weergave-controls (vullen/spiegelen/roteren) en
 * een niet-blokkerende kwaliteitskaart. Voor afbeeldingen is er een tweede
 * weergave, "Op de vlag": een realistische mockup met mast en wapperend doek.
 * Beide weergaven renderen via het herbruikbare {@link ArtworkProof}; de
 * weergave-keuze onthouden we binnen de sessie.
 *
 * De echte upload (client-sniff → sign → uploadToSignedUrl → finalize) draait
 * op de achtergrond, elk met een harde timeout zodat de UI nooit blijft
 * hangen, en levert de definitieve `url`/`path` op. Is de upload gelukt, dan
 * bevestigt de klant met "Dit bestand gebruiken". Mislukt de upload (bijv.
 * lokaal met een dummy-Supabase-env), dan kan de klant het bestand tóch
 * koppelen op basis van de lokale preview ("Toch gebruiken (preview)"), zodat
 * de knop nooit definitief blokkeert. Alles wat de modal sluit vóór
 * bevestiging (Esc, backdrop, ander bestand, sluiten) ruimt een reeds
 * geüploade maar niet-gekoppelde file op via DELETE, plus de lokale
 * object-URL.
 *
 * Kwaliteitswaarschuwingen (te lage DPI / afwijkende verhouding) berekenen we
 * zowel client-side (meteen, uit de gelezen resolutie) als server-side (na
 * finalize, autoritatief). We tonen de server-versie zodra die er is, anders
 * de client-versie. Waarschuwingen zijn altijd NIET-blokkerend.
 */

const BUCKET = "order-artwork";
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB, spiegelt server + bucket-limiet
/**
 * Max bestandsgrootte voor de inline data-URL in de preview-fallback. Base64
 * is ~33% groter en de cart leeft in localStorage (~5 MB), dus boven deze
 * grens vallen we terug op de vluchtige object-URL.
 */
const INLINE_PREVIEW_MAX_BYTES = 3 * 1024 * 1024;
// Chunks die we lezen om de PDF-MediaBox (verhouding) client-side te bepalen.
const PDF_SCAN_BYTES = 64 * 1024;

type Phase = "idle" | "preview" | "error";

/** Preview-weergave: technische drukproef of realistische vlag-mockup. */
type PreviewView = "proof" | "flag";

/** Hoe het ontwerp in het vlagkader valt (CSS object-fit). */
type FitMode = "contain" | "cover" | "fill";

/** Rotatie van het ontwerp in de preview, in graden. */
const ROTATIONS = [0, 90, 180, 270] as const;
type Rotation = (typeof ROTATIONS)[number];

const FIT_OPTIONS: ReadonlyArray<{ value: FitMode; label: string }> = [
  { value: "contain", label: "Passend" },
  { value: "cover", label: "Vullen" },
  { value: "fill", label: "Uitrekken" },
];

/** sessionStorage-sleutel: onthoudt de gekozen weergave binnen de sessie. */
const VIEW_STORAGE_KEY = "artwork-preview-view";

/**
 * Status van de echte upload op de achtergrond. Bij "failed" maakt `reject`
 * het verschil tussen een échte afkeuring van het bestand (verkeerd type, te
 * groot — duidelijke foutmelding) en een niet-beschikbare opslag (netwerk,
 * lokale dev met dummy-Supabase-env — vriendelijke, niet-alarmerende melding:
 * de drukproef zelf klopt gewoon).
 */
type Upload =
  | { status: "uploading" }
  | { status: "done"; url: string; path: string; warnings: string[] }
  | { status: "failed"; message: string; reject: boolean };

/** HTTP-statussen waarmee de server het bestand zélf afkeurt. */
const REJECT_STATUSES = new Set([400, 413, 415]);

/** Het lokaal gekozen bestand + wat we er client-side van weten. */
type Selected = {
  file: File;
  /** Lokale object-URL voor de live preview (moet worden gerevoked). */
  objectUrl: string;
  name: string;
  size: number;
  isImage: boolean;
  /** Ontwerpverhouding (breedte / hoogte) zodra bekend, anders null. */
  ratio: number | null;
  /** Pixelmaten van rasterbeelden zodra gelezen (voor de DPI in de sidebar). */
  pixelWidth: number | null;
  pixelHeight: number | null;
  /** Niet-blokkerende waarschuwingen uit de client-side analyse. */
  warnings: string[];
  /**
   * Compacte raster-preview (data-URL): afbeeldingen gedownschaald, van een
   * PDF de eerste pagina via pdf.js. Dit is de weergave-afbeelding voor alle
   * previews (modal, mockup, cart-thumbnail) en gaat bij bevestigen mee naar
   * de cart-regel. null zolang het rasteren loopt of wanneer het mislukte
   * (PDF valt dan terug op de <embed>).
   */
  preview: string | null;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(name: string): boolean {
  return /\.(jpe?g|png)$/i.test(name);
}

/** cm-waarde in nl-notatie met precies 1 decimaal (zoals "150,0"). */
function formatCm(v: number): string {
  return v.toLocaleString("nl-NL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Max wachttijd per netwerkstap; erna wordt de upload als mislukt beschouwd. */
const UPLOAD_TIMEOUT_MS = 20_000;

/** POST naar /api/artwork met een harde timeout (voorkomt een oneindige await). */
async function postArtwork(body: unknown): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPLOAD_TIMEOUT_MS);
  try {
    return await fetch("/api/artwork", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Lees een bestand als data-URL; null bij een leesfout (fallback beslist). */
function readAsDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/** Race een promise tegen een timeout; bij timeout wint `onTimeout` (geen hang). */
function withTimeout<T>(p: Promise<T>, ms: number, onTimeout: () => T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(onTimeout()), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(onTimeout());
      },
    );
  });
}

/**
 * Tegel-preview in de ontwerpen-strip: de voorbereide preview, anders de
 * afbeelding zelf, anders client-side de eerste PDF-pagina rasteren (gecachet
 * per src in rasterizePdfSrc) — zelfde route als de mini's op de mandregel.
 */
function RailThumb({ design }: { design: CartDesign }) {
  const isImage =
    /\.(jpe?g|png)$/i.test(design.fileName ?? "") ||
    /\.(jpe?g|png)$/i.test(design.fileUrl ?? "");
  const needsRaster = !design.previewUrl && !isImage && !!design.fileUrl;
  const [pdfThumb, setPdfThumb] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!needsRaster || !design.fileUrl) {
      setPdfThumb(null);
      return;
    }
    let cancelled = false;
    setPdfThumb(null);
    void rasterizePdfSrc(design.fileUrl).then((dataUrl) => {
      if (!cancelled && dataUrl) setPdfThumb(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [needsRaster, design.fileUrl]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const src = design.previewUrl ?? (isImage ? design.fileUrl : pdfThumb);

  if (!design.fileUrl) {
    return (
      <span className={styles.railLater} aria-hidden="true">
        ⏱
      </span>
    );
  }
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" />;
  }
  return (
    <span className={styles.railDoc} aria-hidden="true">
      PDF
    </span>
  );
}

export function ArtworkUploadModal({
  open,
  onClose,
  onConfirm,
  widthCm,
  heightCm,
  initialFile,
  finish,
  initialRemote,
  beheer,
}: {
  open: boolean;
  onClose: () => void;
  /**
   * Koppel het definitief geüploade bestand aan de winkelmandregel.
   * `previewUrl` is de compacte raster-preview (data-URL) voor weergave in
   * cart/afrekenen; null wanneer die (nog) niet gemaakt kon worden.
   */
  onConfirm: (
    url: string,
    name: string,
    path: string,
    warnings: string[],
    previewUrl: string | null,
  ) => void;
  widthCm?: number;
  heightCm?: number;
  /**
   * Al gekozen bestand (bijv. uit de multi-kiezer van de mandregel): de modal
   * slaat dan de eigen dropzone over en start meteen met dit bestand, zodat de
   * drukproef gewoon verschijnt.
   */
  initialFile?: File | null;
  /** Afwerkingszone (tunnel/band/ringen) voor de drukproef, indicatief. */
  finish?: ProofFinish;
  /**
   * Al aangeleverd ontwerp om mee te openen: de editor toont dan direct de
   * drukproef van het bestaande bestand (géén nieuwe upload) en "Ander bestand
   * kiezen" wordt de vervang-route. Zo is de miniatuur op de mandregel één
   * klik verwijderd van de volledige editor.
   */
  initialRemote?: {
    url: string;
    path: string;
    name: string;
    warnings: string[];
  } | null;
  /**
   * Beheer-modus: de editor beheert ALLE ontwerpen van de mandregel — een
   * ontwerpen-strip onderin (klik = wisselen, ＋ = bestanden toevoegen), de
   * aantal-verdeling en verwijderen in de zijbalk. Zo gebeurt alles in de
   * uploader, ook bij één ontwerp op drie dezelfde vlaggen. De parent blijft
   * eigenaar van de designs (live gecommit in de cart).
   */
  beheer?: {
    designs: CartDesign[];
    amount: number;
    activeId: string | null;
    onSelect: (id: string) => void;
    onQuantity: (id: string, quantity: number) => void;
    onRemove: (id: string) => void;
    onAddFiles: (files: FileList | File[]) => void;
    onDeliverLater: () => void;
    busyNote?: string | null;
  };
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Aparte kiezer voor de ＋-tegel in de ontwerpen-strip (beheer-modus).
  const railInputRef = useRef<HTMLInputElement>(null);
  // handleFile is pas verderop gedefinieerd; de open-effect leest hem via een
  // ref op run-time, zodat de effect-deps niet op elke render verschuiven.
  const handleFileRef = useRef<
    (
      file: File,
      existing?: { url: string; path: string; warnings: string[] },
    ) => Promise<void>
  >(null!);

  const [phase, setPhase] = useState<Phase>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Weergave-controls voor de drukproef (alleen afbeeldingen); resetten per
  // bestandskeuze. Puur visueel — we drukken het bestand zoals aangeleverd.
  const [fit, setFit] = useState<FitMode>("contain");
  const [mirrored, setMirrored] = useState(false);
  const [rotation, setRotation] = useState<Rotation>(0);

  // "Drukproef" of "Op de vlag"; init altijd "proof" (hydration-veilig), de
  // sessie-keuze laden we na mount uit sessionStorage.
  const [view, setView] = useState<PreviewView>("proof");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(VIEW_STORAGE_KEY);
      if (saved === "proof" || saved === "flag") setView(saved);
    } catch {
      // sessionStorage niet beschikbaar (bijv. privémodus) — default volstaat
    }
  }, []);

  const setViewMode = useCallback((v: PreviewView) => {
    setView(v);
    try {
      sessionStorage.setItem(VIEW_STORAGE_KEY, v);
    } catch {
      // negeren
    }
  }, []);

  // Path van een geüploade-maar-niet-bevestigde file, in een ref zodat cleanup
  // bij sluiten los staat van render-timing. Leeg bij bevestigen of na DELETE.
  const pendingPathRef = useRef<string | null>(null);
  // Actieve object-URL, in een ref zodat we hem altijd kunnen revoken.
  const objectUrlRef = useRef<string | null>(null);
  // Token dat per bestandskeuze ophoogt; async callbacks negeren verouderde
  // resultaten wanneer de klant intussen een ander bestand koos.
  const pickTokenRef = useRef(0);

  const flag: FlagSize | null =
    widthCm && heightCm && widthCm > 0 && heightCm > 0
      ? { widthCm, heightCm }
      : null;

  const deleteOrphan = useCallback(async (path: string): Promise<void> => {
    // Best-effort; een achtergebleven file wordt opgeruimd door
    // scripts/cleanup-artwork.ts.
    try {
      await fetch("/api/artwork", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
    } catch {
      // negeren
    }
  }, []);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    pickTokenRef.current++;
    revokeObjectUrl();
    setPhase("idle");
    setDragOver(false);
    setSelected(null);
    setUpload(null);
    setError(null);
    setFit("contain");
    setMirrored(false);
    setRotation(0);
  }, [revokeObjectUrl]);

  // Gooi een niet-bevestigde upload + lokale preview weg en reset de modal.
  const discardPending = useCallback(async () => {
    const path = pendingPathRef.current;
    pendingPathRef.current = null;
    revokeObjectUrl();
    if (path) await deleteOrphan(path);
  }, [deleteOrphan, revokeObjectUrl]);

  // Synchroniseer de native dialog met de `open`-prop en reset bij (her)openen.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      resetState();
      dlg.showModal();
      if (initialFile) {
        // Bestand al gekozen vóór het openen → direct de drukproef-flow in.
        void handleFileRef.current(initialFile);
      } else if (initialRemote) {
        // Bestaand ontwerp bekijken/vervangen: haal het bestand op en toon de
        // drukproef zonder her-upload. Mislukt de fetch, dan blijft gewoon de
        // dropzone staan.
        const remote = initialRemote;
        void fetch(remote.url)
          .then((res) => (res.ok ? res.blob() : null))
          .then((blob) => {
            if (!blob || !dlg.open) return;
            const file = new File([blob], remote.name, {
              type: blob.type || "application/octet-stream",
            });
            void handleFileRef.current(file, {
              url: remote.url,
              path: remote.path,
              warnings: remote.warnings,
            });
          })
          .catch(() => {});
      }
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open, resetState, initialFile, initialRemote]);

  // Revoke de object-URL als het component verdwijnt.
  useEffect(() => revokeObjectUrl, [revokeObjectUrl]);

  // Beheer-modus: laad het actieve ontwerp in de drukproef zodra de selectie
  // wisselt. Een bestaand bestand wordt opgehaald en zonder her-upload getoond
  // (status direct "done"); een "later aanleveren"-slot toont de dropzone.
  // Bewust alleen afhankelijk van open + activeId: aantal-wijzigingen mogen de
  // proef niet herladen. De rest komt uit refs.
  const beheerRef = useRef(beheer);
  beheerRef.current = beheer;
  const activeBeheerId = beheer?.activeId ?? null;
  useEffect(() => {
    if (!open || !beheerRef.current || !activeBeheerId) return;
    const active = beheerRef.current.designs.find((d) => d.id === activeBeheerId);
    if (!active) return;
    resetState();
    if (!active.fileUrl) return; // later-slot → dropzone
    let cancelled = false;
    const { fileUrl, filePath, fileName, fileWarnings } = active;
    void fetch(fileUrl)
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (cancelled || !blob) return;
        const file = new File([blob], fileName ?? "ontwerp", {
          type: blob.type || "application/octet-stream",
        });
        void handleFileRef.current(file, {
          url: fileUrl,
          path: filePath ?? "",
          warnings: fileWarnings,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, activeBeheerId, resetState]);

  const requestClose = useCallback(() => {
    // Eerst sluiten voor een snappy gevoel; opruimen op de achtergrond.
    void discardPending();
    onClose();
  }, [discardPending, onClose]);

  /**
   * Lees pixelmaten van een raster via een <img>, bouw waarschuwingen en
   * maak meteen de compacte preview-afbeelding (voor cart/afrekenen).
   */
  const analyzeRaster = useCallback(
    (objectUrl: string, kind: "png" | "jpeg", token: number) => {
      const img = new Image();
      img.onload = () => {
        if (token !== pickTokenRef.current) return;
        const pixelWidth = img.naturalWidth;
        const pixelHeight = img.naturalHeight;
        if (pixelWidth <= 0 || pixelHeight <= 0) return;
        const info: ArtworkInfo = { kind, pixelWidth, pixelHeight };
        const warnings = buildWarnings(info, flag);
        const preview = rasterizeImageElement(img, kind);
        setSelected((prev) =>
          prev && prev.objectUrl === objectUrl
            ? {
                ...prev,
                ratio: pixelWidth / pixelHeight,
                pixelWidth,
                pixelHeight,
                warnings,
                preview,
              }
            : prev,
        );
      };
      img.src = objectUrl;
    },
    [flag],
  );

  /** Raster de eerste PDF-pagina naar de preview-afbeelding (pdf.js). */
  const rasterizePdf = useCallback(
    async (file: File, objectUrl: string, token: number) => {
      const preview = await rasterizePdfFirstPage(file);
      if (!preview || token !== pickTokenRef.current) return;
      setSelected((prev) =>
        prev && prev.objectUrl === objectUrl ? { ...prev, preview } : prev,
      );
    },
    [],
  );

  /** Lees de PDF-MediaBox (verhouding) uit kop + staart van het bestand. */
  const analyzePdf = useCallback(
    async (file: File, objectUrl: string, token: number) => {
      try {
        const head = new Uint8Array(
          await file.slice(0, PDF_SCAN_BYTES).arrayBuffer(),
        );
        const tail =
          file.size > PDF_SCAN_BYTES
            ? new Uint8Array(
                await file.slice(file.size - PDF_SCAN_BYTES).arrayBuffer(),
              )
            : undefined;
        if (token !== pickTokenRef.current) return;
        const info = analyzeBytes("pdf", head, tail);
        if (!info || info.kind !== "pdf") return;
        const warnings = buildWarnings(info, flag);
        setSelected((prev) =>
          prev && prev.objectUrl === objectUrl
            ? {
                ...prev,
                ratio: info.heightCm > 0 ? info.widthCm / info.heightCm : null,
                warnings,
              }
            : prev,
        );
      } catch {
        // Verhouding onbekend — geen client-waarschuwing, upload beslist.
      }
    },
    [flag],
  );

  /**
   * Echte upload op de achtergrond: sign → uploadToSignedUrl → finalize.
   * Elke stap heeft een harde timeout: een onbereikbare server of Storage-host
   * (bijv. lokale dev met dummy-Supabase-env) eindigt altijd in status
   * "failed" en laat de UI dus nooit eindeloos op "uploading" hangen.
   */
  const runUpload = useCallback(
    async (file: File, token: number) => {
      setUpload({ status: "uploading" });
      try {
        // 1. Vraag de server om een signed upload-URL (harde timeout).
        const signRes = await postArtwork({
          action: "sign",
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });
        const signData = (await signRes.json()) as {
          path?: string;
          token?: string;
          error?: string;
        };
        if (token !== pickTokenRef.current) return;
        if (!signRes.ok || !signData.path || !signData.token) {
          setUpload({
            status: "failed",
            reject: REJECT_STATUSES.has(signRes.status),
            message: signData.error ?? "Uploaden voorbereiden mislukt.",
          });
          return;
        }

        // 2. Upload de bytes rechtstreeks naar Storage, met harde timeout.
        const supabase = createSupabaseBrowserClient();
        const uploadError = await withTimeout<Error | null>(
          supabase.storage
            .from(BUCKET)
            .uploadToSignedUrl(signData.path, signData.token, file, {
              contentType: file.type,
            })
            .then((r) => (r.error ? new Error(r.error.message) : null)),
          UPLOAD_TIMEOUT_MS,
          () => new Error("Upload duurde te lang."),
        );
        if (token !== pickTokenRef.current) {
          // Klant koos intussen iets anders — ruim deze file weer op.
          void deleteOrphan(signData.path);
          return;
        }
        // Vanaf hier kan het object in storage bestaan — volg het voor cleanup.
        pendingPathRef.current = signData.path;
        if (uploadError) {
          // Storage onbereikbaar (of lokale dev met dummy-env) — geen oordeel
          // over het bestand zelf.
          setUpload({
            status: "failed",
            reject: false,
            message: "Uploaden mislukt. Probeer het opnieuw.",
          });
          return;
        }

        // 3. Finalize: server verifieert het bestand en analyseert de maten.
        const finRes = await postArtwork({
          action: "finalize",
          path: signData.path,
          widthCm,
          heightCm,
        });
        const finData = (await finRes.json()) as {
          url?: string;
          name?: string;
          warnings?: string[];
          error?: string;
        };
        if (token !== pickTokenRef.current) return;
        if (!finRes.ok || !finData.url) {
          // Finalize afgekeurd (bijv. magic-byte mismatch) — server verwijderde
          // het object op een 415; laat onze referentie los.
          pendingPathRef.current = null;
          setUpload({
            status: "failed",
            reject: REJECT_STATUSES.has(finRes.status),
            message: finData.error ?? "Dit bestand kon niet worden verwerkt.",
          });
          return;
        }
        setUpload({
          status: "done",
          url: finData.url,
          path: signData.path,
          warnings: finData.warnings ?? [],
        });
      } catch {
        if (token !== pickTokenRef.current) return;
        setUpload({
          status: "failed",
          reject: false,
          message: "Uploaden mislukt. Controleer je verbinding en probeer opnieuw.",
        });
      }
    },
    [deleteOrphan, widthCm, heightCm],
  );

  /**
   * Nieuw bestand gekozen: valideer, toon direct de preview, upload erachteraan.
   * Met `existing` (al aangeleverd bestand, geopend vanaf de mandregel) wordt
   * de upload overgeslagen: het staat al in Storage, dus de status springt
   * direct op "done" met de bestaande URL.
   */
  const handleFile = useCallback(
    async (
      file: File,
      existing?: { url: string; path: string; warnings: string[] },
    ) => {
      // Vorige selectie/upload ongeldig maken.
      pickTokenRef.current++;
      const token = pickTokenRef.current;
      void discardPending();
      setError(null);
      setUpload(null);
      setFit("contain");
      setMirrored(false);
      setRotation(0);

      if (file.size > MAX_BYTES) {
        setSelected(null);
        setPhase("error");
        setError("Dit bestand is te groot. Kies een bestand van maximaal 50 MB.");
        return;
      }

      // Snelle client-side sniff op de eerste bytes (server blijft autoritair).
      const headBytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      if (token !== pickTokenRef.current) return;
      const kind = sniffKind(headBytes);
      if (!kind) {
        setSelected(null);
        setPhase("error");
        setError("Dit is geen geldig ontwerp. Kies een PDF-, JPG- of PNG-bestand.");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      const isImage = isImageFile(file.name) || kind !== "pdf";

      // Toon de live preview meteen — nog zonder verhouding/warnings.
      setSelected({
        file,
        objectUrl,
        name: file.name,
        size: file.size,
        isImage,
        ratio: null,
        pixelWidth: null,
        pixelHeight: null,
        warnings: [],
        preview: null,
      });
      setPhase("preview");

      // Client-side kwaliteitsanalyse (vult verhouding + waarschuwingen aan)
      // en de raster-preview (PDF: echte eerste pagina via pdf.js).
      if (isImage) {
        analyzeRaster(objectUrl, kind === "png" ? "png" : "jpeg", token);
      } else {
        void analyzePdf(file, objectUrl, token);
        void rasterizePdf(file, objectUrl, token);
      }

      // Echte upload op de achtergrond — tenzij het bestand al bij ons staat.
      if (existing) {
        setUpload({ status: "done", ...existing });
      } else {
        void runUpload(file, token);
      }
    },
    [discardPending, analyzeRaster, analyzePdf, rasterizePdf, runUpload],
  );
  handleFileRef.current = handleFile;

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // sta toe hetzelfde bestand opnieuw te kiezen
    if (file) void handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  async function confirmSelectedFile() {
    if (!selected || !upload || upload.status === "uploading") return;

    if (upload.status === "done") {
      // Bevestigd: behoud het storage-object, geef het aan de parent. De lokale
      // object-URL is niet meer nodig (de cart toont de raster-preview).
      pendingPathRef.current = null;
      revokeObjectUrl();
      onConfirm(
        upload.url,
        selected.name,
        upload.path,
        upload.warnings,
        selected.preview,
      );
      onClose();
      return;
    }

    // FALLBACK (status "failed"): de echte upload lukte niet, bijv. lokale dev
    // zonder werkende Storage. Koppel dan tóch een lokale preview zodat de
    // klant nooit vastloopt; een eventueel wél geüpload maar niet-
    // gefinaliseerd object ruimen we op. Voorkeur: een data-URL, want die zit
    // ingebakken in de cart-state en overleeft dus navigatie/reload (blob-
    // object-URL's zijn dood na een page load). Alleen voor kleine bestanden;
    // grotere houden de vluchtige object-URL met een eerlijke notitie.
    const orphan = pendingPathRef.current;
    pendingPathRef.current = null;
    if (orphan) void deleteOrphan(orphan);

    if (selected.size <= INLINE_PREVIEW_MAX_BYTES) {
      const dataUrl = await readAsDataUrl(selected.file);
      if (dataUrl) {
        revokeObjectUrl(); // de cart gebruikt de data-URL, blob mag weg
        onConfirm(
          dataUrl,
          selected.name,
          "",
          [
            ...selected.warnings,
            "Voorbeeldkoppeling: het uploaden is nog niet gelukt; dit is een lokale preview.",
          ],
          selected.preview,
        );
        onClose();
        return;
      }
    }

    // Te groot voor inline (of leesfout): object-URL zoals voorheen. Het
    // eigenaarschap gaat naar de parent (dus niet revoken).
    const localUrl = selected.objectUrl;
    objectUrlRef.current = null; // niet revoken: de cart gebruikt deze URL nog
    onConfirm(
      localUrl,
      selected.name,
      "",
      [
        ...selected.warnings,
        "Voorbeeldkoppeling: het uploaden is nog niet gelukt; dit is een lokale preview en blijft niet bewaard als je verder navigeert.",
      ],
      selected.preview,
    );
    onClose();
  }

  async function pickAnother() {
    await discardPending();
    resetState();
    // Heropen de bestandskiezer voor een snelle retry.
    inputRef.current?.click();
  }

  function retryUpload() {
    if (!selected) return;
    void runUpload(selected.file, pickTokenRef.current);
  }

  const sizeContext =
    widthCm && heightCm ? `Voor je vlag van ${widthCm} × ${heightCm} cm` : null;

  // Beheer-modus: positie van het actieve ontwerp in de strip + ‹ ›-navigatie
  // en de toewijzingsstand (som van de aantallen tegen het regelaantal).
  const beheerIndex = beheer
    ? beheer.designs.findIndex((d) => d.id === beheer.activeId)
    : -1;
  const beheerActive =
    beheer && beheerIndex >= 0 ? beheer.designs[beheerIndex] : null;
  const beheerAssigned = beheer
    ? beheer.designs.reduce((sum, d) => sum + d.quantity, 0)
    : 0;
  const beheerMissing = beheer ? Math.max(0, beheer.amount - beheerAssigned) : 0;

  // Toewijzingskaart linksboven op het canvas: voor hoeveel van de vlaggen
  // geldt dit ontwerp, plus de totaalstand van de regel.
  const toewijsCard = beheer && beheerActive && (
    <div className={styles.toewijsCard}>
      <span className={styles.toewijsLabel}>
        Dit ontwerp op hoeveel van de {beheer.amount} vlaggen?
      </span>
      {beheer.amount > 1 && (
        <div
          className={styles.designQty}
          role="group"
          aria-label="Aantal vlaggen met dit ontwerp"
        >
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => beheer.onQuantity(beheerActive.id, beheerActive.quantity - 1)}
            disabled={beheerActive.quantity <= 1}
            aria-label="Minder vlaggen met dit ontwerp"
          >
            −
          </button>
          <span className={styles.qtyValue} aria-live="polite">
            {beheerActive.quantity} van {beheer.amount}
          </span>
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => beheer.onQuantity(beheerActive.id, beheerActive.quantity + 1)}
            disabled={beheerMissing === 0}
            aria-label="Meer vlaggen met dit ontwerp"
          >
            +
          </button>
        </div>
      )}
      <span
        className={`${styles.toewijsStatus} ${
          beheerMissing === 0 ? styles.beheerOk : styles.beheerOpen
        }`}
        aria-live="polite"
      >
        {beheerMissing === 0 ? "✓ " : ""}
        {beheerAssigned} van {beheer.amount} toegewezen
        {beheerMissing > 0 && ` · nog ${beheerMissing} open`}
      </span>
    </div>
  );

  // Toon de autoritaire server-waarschuwingen zodra die er zijn, anders de
  // client-side inschatting.
  const shownWarnings =
    upload && upload.status === "done" ? upload.warnings : selected?.warnings ?? [];
  // Bevestigen kan zodra de upload klaar is; bij een mislukte upload via de
  // preview-fallback. Alleen tijdens het uploaden zelf is de knop even dicht.
  const canConfirm = upload?.status === "done" || upload?.status === "failed";

  // Sidebar-feiten: de vlagmaat (eindformaat), het benodigde aanleverformaat
  // (vlagmaat + 1 cm afloop rondom, dus +2 cm per zijde — zoals drukkers dat
  // officieel vragen) en de effectieve DPI (px / (cm / 2,54)), rekening
  // houdend met 90°/270°-rotatie. PDF = vector, dus geen zinnige DPI: "-".
  const sizeLabel = flag
    ? `${formatCm(flag.widthCm)} × ${formatCm(flag.heightCm)} cm`
    : "-";
  const deliveryLabel = flag
    ? `${formatCm(flag.widthCm + 2)} × ${formatCm(flag.heightCm + 2)} cm`
    : "-";
  const dpiLabel = (() => {
    if (!selected || !selected.isImage || !flag) return "-";
    if (!selected.pixelWidth || !selected.pixelHeight) return "…";
    const quarter = rotation === 90 || rotation === 270;
    const pw = quarter ? selected.pixelHeight : selected.pixelWidth;
    const ph = quarter ? selected.pixelWidth : selected.pixelHeight;
    const dpi = Math.min(
      pw / (flag.widthCm / 2.54),
      ph / (flag.heightCm / 2.54),
    );
    return String(Math.round(dpi));
  })();

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="artwork-modal-title"
      onCancel={(e) => {
        // Onderschep Esc zodat we de orphan zelf kunnen opruimen.
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        // Backdrop-klik: alleen als de druk op de dialog zelf landt.
        if (e.target === dialogRef.current) requestClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <div>
            <h2 id="artwork-modal-title" className={styles.modalTitle}>
              Ontwerp uploaden
            </h2>
            {sizeContext && <p className={styles.modalContext}>{sizeContext}</p>}
          </div>
          {/* Acties rechtsboven: altijd zichtbaar en nooit afgedekt door de
              ontwerpen-strip of de schermrand. */}
          {phase === "preview" && selected && (
            <div className={styles.headActions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={requestClose}
              >
                Sluiten
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={() => void confirmSelectedFile()}
                disabled={!canConfirm}
                title={
                  canConfirm
                    ? undefined
                    : "Wacht tot de upload klaar is om dit bestand te gebruiken"
                }
              >
                {upload?.status === "uploading"
                  ? "Uploaden…"
                  : upload?.status === "failed"
                    ? "Toch gebruiken (preview)"
                    : "Opslaan"}
              </button>
            </div>
          )}
          <button
            type="button"
            className={styles.close}
            onClick={requestClose}
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className={styles.input}
          onChange={onPick}
          aria-label="Ontwerpbestand kiezen"
        />

        {phase === "idle" && (
          <div
            className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <span className={styles.dropIcon} aria-hidden="true">
              ⬆
            </span>
            <span className={styles.dropTitle}>
              Sleep je ontwerp hierheen of kies een bestand
            </span>
            <span className={styles.dropHint}>PDF, JPG of PNG · max 50 MB</span>
            <span className={styles.dropButton}>Bestand kiezen</span>
          </div>
        )}

        {phase === "preview" && selected && (
          <div className={styles.result}>
            {/* ── Linkerkolom: de grote drukproef of vlag-mockup ── */}
            <div className={styles.previewCol}>
              {(() => {
                // Weergavebron: afbeeldingen op volle resolutie (object-URL);
                // een PDF via de raster-preview (echte eerste pagina, pdf.js)
                // zodra die klaar is. Alleen zolang/wanneer pdf.js niets
                // oplevert valt de PDF terug op de native <embed>.
                const previewIsImage = selected.isImage || selected.preview !== null;
                const previewSrc = selected.isImage
                  ? selected.objectUrl
                  : selected.preview ?? selected.objectUrl;
                const pdfEmbed = (
                  <embed
                    className={styles.pdfEmbed}
                    src={`${selected.objectUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                    type="application/pdf"
                    aria-label={`Voorbeeld van ${selected.name}`}
                  />
                );

                // Zonder vlagmaat kunnen we geen hulplijnen tekenen: platte preview.
                if (!flag) {
                  return (
                    <div className={styles.stage}>
                      {toewijsCard}
                      {previewIsImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className={styles.plainPreview}
                          src={previewSrc}
                          alt={`Voorbeeld van ${selected.name}`}
                        />
                      ) : (
                        <div className={styles.plainPdf}>{pdfEmbed}</div>
                      )}
                    </div>
                  );
                }

                // Live transformatie vanuit de sidebar-controls. Bij 90°/270°
                // wisselen breedte en hoogte van het beeldvak; met de
                // vlagverhouding rekenen we dat om zodat het gedraaide vak het
                // kader exact blijft vullen.
                const quarter = rotation === 90 || rotation === 270;

                // Bestand op AANLEVERFORMAAT (vlagmaat + 1 cm afloop rondom)?
                // Teken het dan dóór tot de afloop-lijn in plaats van passend
                // bínnen het eindformaat — anders toont de proef valse
                // witranden bij een correct aangeleverd bestand. Alleen bij
                // "Passend" en zonder kwartslag.
                const bleedW = flag.widthCm + 2;
                const bleedH = flag.heightCm + 2;
                const bleedRatio = bleedW / bleedH;
                const flagRatio = flag.widthCm / flag.heightCm;
                const designRatio = selected.ratio;
                const bleedSized =
                  designRatio !== null &&
                  fit === "contain" &&
                  !quarter &&
                  Math.abs(designRatio - bleedRatio) <=
                    Math.abs(designRatio - flagRatio) &&
                  Math.abs(designRatio - bleedRatio) / bleedRatio < 0.05;

                const transformParts = [
                  quarter || bleedSized ? "translate(-50%, -50%)" : null,
                  rotation !== 0 ? `rotate(${rotation}deg)` : null,
                  mirrored ? "scaleX(-1)" : null,
                ].filter((p): p is string => p !== null);
                const layerStyle: React.CSSProperties = {
                  objectFit: bleedSized ? "fill" : fit,
                  transform: transformParts.length
                    ? transformParts.join(" ")
                    : undefined,
                  ...(quarter
                    ? {
                        top: "50%",
                        left: "50%",
                        width: `calc(100% * ${flag.heightCm} / ${flag.widthCm})`,
                        height: `calc(100% * ${flag.widthCm} / ${flag.heightCm})`,
                      }
                    : bleedSized
                      ? {
                          top: "50%",
                          left: "50%",
                          right: "auto",
                          bottom: "auto",
                          width: `calc(100% * ${bleedW} / ${flag.widthCm})`,
                          height: `calc(100% * ${bleedH} / ${flag.heightCm})`,
                          maxWidth: "none",
                          maxHeight: "none",
                        }
                      : null),
                };

                // Mockup zodra we een échte afbeelding hebben — voor PDF dus
                // pas wanneer de raster-preview klaar is (een CSS-filter
                // grijpt niet op de inhoud van een <embed>-plugin).
                const mode: PreviewView = previewIsImage ? view : "proof";

                return (
                  <div className={styles.stage}>
                    {toewijsCard}
                    {previewIsImage && (
                      <div
                        className={styles.viewToggle}
                        role="group"
                        aria-label="Weergave van de preview"
                      >
                        <button
                          type="button"
                          className={
                            mode === "proof"
                              ? `${styles.viewOption} ${styles.viewOptionActive}`
                              : styles.viewOption
                          }
                          aria-pressed={mode === "proof"}
                          onClick={() => setViewMode("proof")}
                        >
                          Drukproef
                        </button>
                        <button
                          type="button"
                          className={
                            mode === "flag"
                              ? `${styles.viewOption} ${styles.viewOptionActive}`
                              : styles.viewOption
                          }
                          aria-pressed={mode === "flag"}
                          onClick={() => setViewMode("flag")}
                        >
                          Op de vlag
                        </button>
                      </div>
                    )}

                    {mode === "flag" ? (
                      <>
                        {/* Realistische mockup: mast + wapperend doek. */}
                        <ArtworkProof
                          className={styles.mockupSize}
                          mode="mockup"
                          wave
                          src={previewSrc}
                          isImage
                          widthCm={flag.widthCm}
                          heightCm={flag.heightCm}
                          imgStyle={layerStyle}
                          alt={`Voorbeeld van ${selected.name} als vlag aan de mast`}
                        />
                        <p className={styles.stageHint}>
                          Zo wappert je ontwerp straks aan de mast.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className={styles.proofGrid}>
                          {/* Hoogte-maat verticaal langs de zijkant, buiten het kader. */}
                          <span className={styles.axisH}>{flag.heightCm} cm</span>

                          {/* Het vlagkader met hulplijnen; afbeeldingen krijgen
                              de live weergave-instellingen mee, PDF toont de
                              echte eerste pagina. */}
                          <ArtworkProof
                            className={styles.proofFrame}
                            mode="drukproef"
                            showGuides
                            finish={finish}
                            src={previewSrc}
                            isImage={previewIsImage}
                            widthCm={flag.widthCm}
                            heightCm={flag.heightCm}
                            imgStyle={layerStyle}
                            alt={`Voorbeeld van ${selected.name} in het vlagkader`}
                          />

                          {/* Breedte-maat gecentreerd onder het kader. */}
                          <span className={styles.axisW}>{flag.widthCm} cm</span>
                        </div>

                        {/* Legenda onder het kader. */}
                        <div className={styles.legend}>
                          <span className={styles.legendItem}>
                            <span className={styles.swatchCut} aria-hidden="true" />
                            Eindformaat
                          </span>
                          <span className={styles.legendItem}>
                            <span className={styles.swatchBleed} aria-hidden="true" />
                            Afloop (+1 cm rondom)
                          </span>
                          <span className={styles.legendItem}>
                            <span className={styles.swatchSafe} aria-hidden="true" />
                            Veilige marge (1 cm)
                          </span>
                          {finish && (
                            <span className={styles.legendItem}>
                              <span
                                className={
                                  finish.kind === "ringen"
                                    ? styles.swatchRing
                                    : styles.swatchFinish
                                }
                                aria-hidden="true"
                              />
                              {finish.label} (indicatief)
                            </span>
                          )}
                        </div>

                        <p className={styles.stageHint}>
                          Je volledige ontwerp, passend in het vlagkader. Houd
                          belangrijke tekst en logo&apos;s binnen de veilige marge.
                        </p>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* ── Rechterkolom: bestandsinfo, instellingen en acties ── */}
            <aside
              className={styles.sidebar}
              aria-label="Bestandsinfo en instellingen"
            >
              <div className={styles.fileCard}>
                <span className={styles.fileTitle} title={selected.name}>
                  {selected.name}
                </span>
                <dl className={styles.fileFacts}>
                  <div className={styles.fileFact}>
                    <dt>Vlagmaat</dt>
                    <dd>{sizeLabel}</dd>
                  </div>
                  <div className={styles.fileFact}>
                    <dt>Aanleverformaat</dt>
                    <dd>{deliveryLabel}</dd>
                  </div>
                  <div className={styles.fileFact}>
                    <dt>Dpi</dt>
                    <dd>{dpiLabel}</dd>
                  </div>
                  <div className={styles.fileFact}>
                    <dt>Bestand</dt>
                    <dd>{formatBytes(selected.size)}</dd>
                  </div>
                </dl>
                {flag && (
                  <p className={styles.fileNote}>
                    Benodigd aanleverformaat = vlagmaat + 1 cm afloop rondom.
                  </p>
                )}
              </div>

              {selected.isImage && flag ? (
                <div className={styles.controls}>
                  <div className={styles.controlRow}>
                    <span className={styles.controlLabel}>Vullen</span>
                    <div className={styles.segment} role="group" aria-label="Vullen">
                      {FIT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={
                            fit === opt.value
                              ? `${styles.segBtn} ${styles.segActive}`
                              : styles.segBtn
                          }
                          aria-pressed={fit === opt.value}
                          onClick={() => setFit(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.controlRow}>
                    <span className={styles.controlLabel}>Spiegelen</span>
                    <button
                      type="button"
                      className={
                        mirrored
                          ? `${styles.segBtn} ${styles.segActive}`
                          : styles.segBtn
                      }
                      aria-pressed={mirrored}
                      onClick={() => setMirrored((m) => !m)}
                    >
                      {mirrored ? "Aan" : "Uit"}
                    </button>
                  </div>

                  <div className={styles.controlRow}>
                    <span className={styles.controlLabel}>Roteren</span>
                    <div className={styles.segment} role="group" aria-label="Roteren">
                      {ROTATIONS.map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          className={
                            rotation === deg
                              ? `${styles.segBtn} ${styles.segActive}`
                              : styles.segBtn
                          }
                          aria-pressed={rotation === deg}
                          onClick={() => setRotation(deg)}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className={styles.controlNote}>
                    Weergave-instellingen voor de drukproef; we drukken je
                    bestand zoals aangeleverd.
                  </p>
                </div>
              ) : (
                !selected.isImage && (
                  <p className={styles.controlNote}>
                    Vullen, spiegelen en roteren zijn niet beschikbaar voor
                    PDF-bestanden.
                  </p>
                )
              )}

              {/* Beheer-acties: de verdeling zelf zit linksboven op het canvas
                  (toewijsCard); hier alleen de secundaire acties. */}
              {beheer && beheerActive && (
                <div className={styles.controls}>
                  <div className={styles.controlRow}>
                    <span className={styles.beheerActies}>
                      {beheerMissing > 0 && (
                        <button
                          type="button"
                          className={styles.linkButton}
                          onClick={beheer.onDeliverLater}
                        >
                          Rest later aanleveren
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => beheer.onRemove(beheerActive.id)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="15"
                          height="15"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                        Ontwerp verwijderen
                      </button>
                    </span>
                  </div>
                </div>
              )}

              {/* Kwaliteitskaart — altijd niet-blokkerend. */}
              {shownWarnings.length > 0 ? (
                <div className={`${styles.qualityBox} ${styles.qualityWarn}`}>
                  <div className={styles.qualityTop}>
                    <span className={styles.qualityHead}>
                      <span aria-hidden="true">⚠︎</span> Waarschuwing
                    </span>
                    <a
                      className={styles.qualityMore}
                      href="/contact"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Meer informatie
                    </a>
                  </div>
                  <ul className={styles.qualityList}>
                    {shownWarnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                  <p className={styles.qualityNote}>
                    Je kunt dit bestand toch gebruiken, maar de druk kan afwijken.
                  </p>
                </div>
              ) : (
                <div className={`${styles.qualityBox} ${styles.qualityOk}`}>
                  <span className={styles.qualityHead}>
                    <span className={styles.qualityCheck} aria-hidden="true">
                      ✓
                    </span>
                    Ontwerp ziet er goed uit
                  </span>
                  <p className={styles.qualityNote}>
                    De resolutie en verhouding passen bij je vlagmaat.
                  </p>
                </div>
              )}

              {/* Upload-status (los van de preview, niet-blokkerend). */}
              {upload?.status === "uploading" && (
                <div
                  className={styles.uploadStatus}
                  role="status"
                  aria-live="polite"
                >
                  <span className={styles.spinnerSmall} aria-hidden="true" />
                  <span>Ontwerp uploaden…</span>
                </div>
              )}
              {upload?.status === "done" && (
                <div className={`${styles.uploadStatus} ${styles.uploadDone}`}>
                  <span className={styles.uploadCheck} aria-hidden="true">
                    ✓
                  </span>
                  <span>Upload gereed</span>
                </div>
              )}
              {upload?.status === "failed" &&
                (upload.reject ? (
                  // Échte afkeuring (verkeerd bestandstype, te groot):
                  // duidelijke foutmelding.
                  <div className={`${styles.uploadStatus} ${styles.uploadFailed}`}>
                    <span aria-hidden="true">⚠︎</span>
                    <span className={styles.uploadFailedText}>
                      {upload.message} Kies een ander bestand of probeer het
                      opnieuw.
                    </span>
                    <button
                      type="button"
                      className={styles.retry}
                      onClick={retryUpload}
                    >
                      Opnieuw uploaden
                    </button>
                  </div>
                ) : (
                  // Opslag even niet bereikbaar (bijv. lokale dev): het
                  // bestand is prima, dus informatief en niet-alarmerend.
                  <div
                    className={`${styles.uploadStatus} ${styles.uploadSoft}`}
                    role="status"
                    aria-live="polite"
                  >
                    <span className={styles.uploadInfo} aria-hidden="true">
                      i
                    </span>
                    <span className={styles.uploadSoftText}>
                      Je drukproef klopt. Opslaan bij ons kan zo, of ga alvast
                      verder met de preview.
                    </span>
                    <button
                      type="button"
                      className={styles.retryQuiet}
                      onClick={retryUpload}
                    >
                      Opnieuw uploaden
                    </button>
                  </div>
                ))}

              <button
                type="button"
                className={styles.linkButton}
                onClick={() => void pickAnother()}
              >
                Ander bestand kiezen
              </button>

            </aside>
          </div>
        )}

        {phase === "error" && (
          <div className={styles.errorBox} role="alert">
            <span className={styles.errorTitle}>Er ging iets mis</span>
            <p className={styles.errorText}>{error}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={requestClose}
              >
                Annuleren
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={() => {
                  resetState();
                  inputRef.current?.click();
                }}
              >
                Opnieuw proberen
              </button>
            </div>
          </div>
        )}

        {/* ── Ontwerpen-strip (beheer-modus): alle ontwerpen van de regel,
            wisselen met een klik of met ‹ ›, bestanden toevoegen met ＋. ── */}
        {beheer && (
          <div className={styles.designRail} aria-label="Ontwerpen van deze regel">
            <input
              ref={railInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,application/pdf"
              className={styles.input}
              onChange={(e) => {
                if (e.target.files?.length) beheer.onAddFiles(e.target.files);
                e.target.value = "";
              }}
              aria-label="Ontwerpbestanden toevoegen"
            />
            <span className={styles.railLabel}>
              Ontwerpen op deze regel ({beheer.designs.length})
              {beheer.busyNote && (
                <span className={styles.railNote} role="status">
                  {" "}
                  · {beheer.busyNote}
                </span>
              )}
            </span>
            <div className={styles.railTiles}>
              {beheer.designs.map((d, i) => {
                return (
                  <span key={d.id} className={styles.railWrap}>
                    <button
                      type="button"
                      className={
                        d.id === beheer.activeId
                          ? `${styles.railTile} ${styles.railTileActive}`
                          : styles.railTile
                      }
                      onClick={() => beheer.onSelect(d.id)}
                      aria-label={
                        d.fileUrl
                          ? `Ontwerp ${d.fileName ?? ""} (${d.quantity} van ${beheer.amount})`
                          : `Later aanleveren (${d.quantity} van ${beheer.amount})`
                      }
                      aria-pressed={d.id === beheer.activeId}
                    >
                      <RailThumb design={d} />
                      <span className={styles.railQty}>{d.quantity}×</span>
                    </button>
                    <button
                      type="button"
                      className={styles.railRemove}
                      onClick={() => beheer.onRemove(d.id)}
                      aria-label={`Ontwerp ${d.fileName ?? ""} verwijderen`}
                    >
                      ✕
                    </button>
                    <span className={styles.railName}>
                      {d.fileUrl ? (d.fileName ?? `Ontwerp ${i + 1}`) : "Later aanleveren"}
                    </span>
                  </span>
                );
              })}
              <span className={styles.railWrap}>
                <button
                  type="button"
                  className={styles.railAdd}
                  onClick={() => railInputRef.current?.click()}
                  aria-label="Ontwerpen toevoegen"
                >
                  ＋
                </button>
                <span className={styles.railName}>Toevoegen</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
