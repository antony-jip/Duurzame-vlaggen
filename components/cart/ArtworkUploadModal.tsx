"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { sniffKind } from "@/lib/artwork/sniff";
import styles from "./ArtworkUpload.module.css";

/**
 * Pop-up (native <dialog>) upload experience for a single cart line's artwork.
 *
 * The upload logic is unchanged from the inline version: client magic-byte
 * pre-sniff → POST {action:"sign"} → uploadToSignedUrl (browser → Supabase) →
 * POST {action:"finalize"} → {url, name, warnings[]}. What is new is that the
 * finalized-but-not-yet-attached file lives in the modal until the customer
 * explicitly confirms with "Dit bestand gebruiken". Anything that closes the
 * modal before that (Esc, backdrop, "Ander bestand kiezen", cancel) deletes the
 * orphaned upload via DELETE so no stray objects are left behind.
 *
 * `onConfirm` hands the finalized file back to the parent, which owns
 * `setItemFile` and the cleanup of the *previous* file on a replace.
 */

const BUCKET = "order-artwork";
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB, mirrors the server + bucket limit

type Phase = "idle" | "uploading" | "result" | "error";
type Step = "sign" | "upload" | "check";

/** Detected artwork dimensions returned by the finalize step (may be null). */
type Dimensions =
  | { kind: "raster"; pixelWidth: number; pixelHeight: number; ratio: number | null }
  | { kind: "pdf"; widthCm: number; heightCm: number; ratio: number | null };

type Uploaded = {
  url: string;
  name: string;
  path: string;
  warnings: string[];
  size: number;
  isImage: boolean;
  /** Design aspect ratio (width / height), when known. */
  ratio: number | null;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(name: string): boolean {
  return /\.(jpe?g|png)$/i.test(name);
}

/**
 * How far the design overflows the flag's cut area under a "cover" fit, as
 * percentages of the flag frame. Exactly one axis is 100%; the other exceeds it
 * and is the part that gets bled/cut off. Used to size the dimmed bleed layer.
 */
function bleedSize(designRatio: number, flagRatio: number): { w: number; h: number } {
  if (designRatio >= flagRatio) {
    return { w: (designRatio / flagRatio) * 100, h: 100 };
  }
  return { w: 100, h: (flagRatio / designRatio) * 100 };
}

export function ArtworkUploadModal({
  open,
  onClose,
  onConfirm,
  widthCm,
  heightCm,
}: {
  open: boolean;
  onClose: () => void;
  /** Attach the finalized file to the cart line. */
  onConfirm: (url: string, name: string, path: string, warnings: string[]) => void;
  widthCm?: number;
  heightCm?: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState<Step>("sign");
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState<Uploaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Fallback design ratio read from the loaded <img> when the server didn't
  // return dimensions (raster only).
  const [imgRatio, setImgRatio] = useState<number | null>(null);

  // Path of a finalized-but-unconfirmed upload, tracked in a ref so cleanup on
  // close works regardless of render timing. Cleared on confirm (kept) or after
  // its DELETE (discarded).
  const pendingPathRef = useRef<string | null>(null);

  const deleteOrphan = useCallback(async (path: string): Promise<void> => {
    // Best-effort; a leftover file is swept by scripts/cleanup-artwork.ts.
    try {
      await fetch("/api/artwork", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
    } catch {
      // ignore
    }
  }, []);

  const resetState = useCallback(() => {
    setPhase("idle");
    setStep("sign");
    setDragOver(false);
    setUploaded(null);
    setError(null);
    setImgRatio(null);
  }, []);

  // Discard any unconfirmed upload and return the modal to a clean state.
  const discardPending = useCallback(async () => {
    const path = pendingPathRef.current;
    pendingPathRef.current = null;
    if (path) await deleteOrphan(path);
  }, [deleteOrphan]);

  // Sync the native dialog with the `open` prop and reset on (re)open.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      resetState();
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open, resetState]);

  const requestClose = useCallback(() => {
    // Close first for a snappy feel; clean up the orphan in the background.
    void discardPending();
    onClose();
  }, [discardPending, onClose]);

  async function runUpload(file: File) {
    setError(null);

    if (file.size > MAX_BYTES) {
      setPhase("error");
      setError("Dit bestand is te groot. Kies een bestand van maximaal 50 MB.");
      return;
    }

    setPhase("uploading");
    setStep("sign");

    try {
      // Fast client-side sniff on the leading bytes (server stays authoritative).
      const headBytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      if (!sniffKind(headBytes)) {
        setPhase("error");
        setError("Dit is geen geldig ontwerp. Kies een PDF-, JPG- of PNG-bestand.");
        return;
      }

      // 1. Ask the server for a signed upload URL.
      const signRes = await fetch("/api/artwork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sign",
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });
      const signData = (await signRes.json()) as {
        path?: string;
        token?: string;
        error?: string;
      };
      if (!signRes.ok || !signData.path || !signData.token) {
        setPhase("error");
        setError(signData.error ?? "Uploaden mislukt. Probeer het opnieuw.");
        return;
      }

      // 2. Upload the bytes straight to Storage.
      setStep("upload");
      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(signData.path, signData.token, file, {
          contentType: file.type,
        });
      // From here the object exists in storage — track it for cleanup.
      pendingPathRef.current = signData.path;
      if (uploadError) {
        setPhase("error");
        setError("Uploaden mislukt. Probeer het opnieuw.");
        return;
      }

      // 3. Finalize: server verifies the file and analyses the dimensions.
      setStep("check");
      const finRes = await fetch("/api/artwork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize",
          path: signData.path,
          widthCm,
          heightCm,
        }),
      });
      const finData = (await finRes.json()) as {
        url?: string;
        name?: string;
        warnings?: string[];
        dimensions?: Dimensions | null;
        error?: string;
      };
      if (!finRes.ok || !finData.url) {
        // Finalize rejected (e.g. magic-byte mismatch) — the server already
        // removed the object on a 415; drop our reference either way.
        pendingPathRef.current = null;
        setPhase("error");
        setError(finData.error ?? "Dit bestand kon niet worden verwerkt.");
        return;
      }

      const name = finData.name ?? file.name;
      const ratio =
        finData.dimensions && typeof finData.dimensions.ratio === "number"
          ? finData.dimensions.ratio
          : null;
      setUploaded({
        url: finData.url,
        name,
        path: signData.path,
        warnings: finData.warnings ?? [],
        size: file.size,
        isImage: isImageFile(name) || isImageFile(finData.url),
        ratio,
      });
      setPhase("result");
    } catch {
      setPhase("error");
      setError("Uploaden mislukt. Controleer je verbinding en probeer het opnieuw.");
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (file) void runUpload(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void runUpload(file);
  }

  function useThisFile() {
    if (!uploaded) return;
    // Confirmed: keep the object, hand it to the parent, don't clean it up.
    pendingPathRef.current = null;
    onConfirm(uploaded.url, uploaded.name, uploaded.path, uploaded.warnings);
    onClose();
  }

  async function pickAnother() {
    await discardPending();
    resetState();
    // Re-open the file picker for a quick retry.
    inputRef.current?.click();
  }

  const sizeContext =
    widthCm && heightCm ? `Voor je vlag van ${widthCm} × ${heightCm} cm` : null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="artwork-modal-title"
      onCancel={(e) => {
        // Intercept Esc so we can clean up the orphan ourselves.
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        // Backdrop click: only when the press lands on the dialog itself.
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
            <span className={styles.dropHint}>PDF, JPG of PNG — max 50 MB</span>
            <span className={styles.dropButton}>Bestand kiezen</span>
          </div>
        )}

        {phase === "uploading" && (
          <div className={styles.progress} role="status" aria-live="polite">
            <span className={styles.spinner} aria-hidden="true" />
            <span className={styles.progressLabel}>
              {step === "sign" && "Uploaden voorbereiden…"}
              {step === "upload" && "Bestand uploaden…"}
              {step === "check" && "Ontwerp controleren…"}
            </span>
            <ol className={styles.steps}>
              <li className={step === "sign" ? styles.stepActive : styles.stepDone}>
                Voorbereiden
              </li>
              <li
                className={
                  step === "upload"
                    ? styles.stepActive
                    : step === "check"
                      ? styles.stepDone
                      : styles.stepPending
                }
              >
                Uploaden
              </li>
              <li className={step === "check" ? styles.stepActive : styles.stepPending}>
                Controleren
              </li>
            </ol>
          </div>
        )}

        {phase === "result" && uploaded && (
          <div className={styles.result}>
            {(() => {
              const flagRatio =
                widthCm && heightCm && heightCm > 0 ? widthCm / heightCm : null;
              const designRatio = uploaded.ratio ?? imgRatio;
              const bleed =
                designRatio && flagRatio ? bleedSize(designRatio, flagRatio) : null;

              // Without a flag size we can't draw cut lines — plain preview.
              if (!flagRatio) {
                return (
                  <div className={styles.stage}>
                    {uploaded.isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className={styles.plainPreview}
                        src={uploaded.url}
                        alt={`Voorbeeld van ${uploaded.name}`}
                        onLoad={(e) => {
                          const el = e.currentTarget;
                          if (el.naturalHeight > 0)
                            setImgRatio(el.naturalWidth / el.naturalHeight);
                        }}
                      />
                    ) : (
                      <span className={styles.pdfTile} aria-hidden="true">
                        PDF
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <div className={styles.stage}>
                  <div
                    className={styles.flagFrame}
                    style={{ aspectRatio: `${widthCm} / ${heightCm}` }}
                  >
                    {uploaded.isImage ? (
                      <>
                        {/* Dimmed full design: everything outside the frame is cut. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className={styles.bleedLayer}
                          src={uploaded.url}
                          alt=""
                          aria-hidden="true"
                          style={
                            bleed
                              ? { width: `${bleed.w}%`, height: `${bleed.h}%` }
                              : undefined
                          }
                          onLoad={(e) => {
                            const el = e.currentTarget;
                            if (!designRatio && el.naturalHeight > 0)
                              setImgRatio(el.naturalWidth / el.naturalHeight);
                          }}
                        />
                        {/* Kept (printed) region at full opacity, clipped to the frame. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className={styles.keepLayer}
                          src={uploaded.url}
                          alt={`Voorbeeld van ${uploaded.name} binnen de snijlijnen`}
                        />
                      </>
                    ) : (
                      <>
                        {/* PDF can't render client-side: sketch its ratio + tile. */}
                        {bleed && (
                          <span
                            className={styles.pdfSketch}
                            aria-hidden="true"
                            style={{ width: `${bleed.w}%`, height: `${bleed.h}%` }}
                          />
                        )}
                        <span className={styles.pdfTile} aria-hidden="true">
                          PDF
                        </span>
                      </>
                    )}
                    {/* Cut lines = the flag edge. */}
                    <span className={styles.cutBorder} aria-hidden="true" />
                    <span className={`${styles.cutLabel} ${styles.cutLabelTop}`}>
                      snijlijn
                    </span>
                    <span className={`${styles.dimLabel} ${styles.dimW}`}>
                      {widthCm} cm
                    </span>
                    <span className={`${styles.dimLabel} ${styles.dimH}`}>
                      {heightCm} cm
                    </span>
                  </div>
                  <p className={styles.stageHint}>
                    {uploaded.isImage
                      ? "De gestippelde lijn is de snijlijn van je vlag. Het gedimde deel valt buiten de vlag en wordt afgesneden."
                      : "De gestippelde lijn is de snijlijn van je vlag. We kunnen een PDF hier niet tonen; het kader laat de verhouding van je bestand t.o.v. de vlag zien."}
                  </p>
                </div>
              );
            })()}
            <div className={styles.resultMeta}>
              <span className={styles.resultName} title={uploaded.name}>
                {uploaded.name}
              </span>
              <span className={styles.resultSize}>{formatBytes(uploaded.size)}</span>
            </div>

            {uploaded.warnings.length > 0 ? (
              <div className={`${styles.qualityBox} ${styles.qualityWarn}`}>
                <span className={styles.qualityHead}>
                  <span aria-hidden="true">⚠︎</span> Let op je ontwerp
                </span>
                <ul className={styles.qualityList}>
                  {uploaded.warnings.map((w) => (
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

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => void pickAnother()}
              >
                Ander bestand kiezen
              </button>
              <button type="button" className={styles.primary} onClick={useThisFile}>
                Dit bestand gebruiken
              </button>
            </div>
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
      </div>
    </dialog>
  );
}
