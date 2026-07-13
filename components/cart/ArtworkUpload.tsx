"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { ArtworkUploadModal } from "./ArtworkUploadModal";
import styles from "./ArtworkUpload.module.css";

/**
 * Per-line artwork upload for the winkelmand.
 *
 * The actual upload flow (client sniff → sign → uploadToSignedUrl → finalize)
 * lives in {@link ArtworkUploadModal}, a native <dialog> pop-up. This component
 * renders the compact cart-line summary (thumbnail, name, ✓/⚠︎ badge, warnings)
 * and opens the modal for uploading/replacing. The finalized file is committed
 * to the cart line here via `setItemFile`; on a replace we clean up the file we
 * just replaced. Removing a file does not need the modal.
 */

export function ArtworkUpload({
  itemId,
  fileUrl,
  fileName,
  filePath,
  fileWarnings,
  widthCm,
  heightCm,
}: {
  itemId: string;
  fileUrl?: string | null;
  fileName?: string | null;
  filePath?: string | null;
  fileWarnings?: string[];
  widthCm?: number;
  heightCm?: number;
}) {
  const { setItemFile } = useCart();
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function deleteOrphan(path: string): Promise<void> {
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
  }

  function onConfirm(url: string, name: string, path: string, warnings: string[]) {
    const previousPath = filePath ?? null;
    setItemFile(itemId, url, name, path, warnings);
    // Replace succeeded → clean up the file we just replaced.
    if (previousPath && previousPath !== path) void deleteOrphan(previousPath);
  }

  async function onRemove() {
    setBusy(true);
    const path = filePath ?? null;
    setItemFile(itemId, null, null, null, []);
    if (path) await deleteOrphan(path);
    setBusy(false);
  }

  const isImage =
    /\.(jpe?g|png)$/i.test(fileName ?? "") || /\.(jpe?g|png)$/i.test(fileUrl ?? "");
  const warnings = fileWarnings ?? [];

  return (
    <div className={styles.wrap}>
      {fileUrl ? (
        <div className={styles.done}>
          {/* Preview zodat de klant zijn ontwerp terugziet. */}
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.preview}
            aria-label={`Ontwerp openen: ${fileName ?? "bestand"}`}
          >
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl} alt={`Voorbeeld van ${fileName ?? "je ontwerp"}`} />
            ) : (
              <span className={styles.pdfBadge}>PDF</span>
            )}
          </a>
          <div className={styles.doneMeta}>
            <span className={styles.doneLabel}>
              {warnings.length > 0 ? (
                <span className={styles.warnBadge} aria-hidden="true">
                  ⚠︎
                </span>
              ) : (
                <span className={styles.check} aria-hidden="true">
                  ✓
                </span>
              )}
              <span className={styles.fileName}>{fileName ?? "Ontwerp"}</span>
            </span>
            <span className={styles.doneActions}>
              <button
                type="button"
                className={styles.link}
                onClick={() => setModalOpen(true)}
                disabled={busy}
              >
                Vervangen
              </button>
              <button
                type="button"
                className={styles.link}
                onClick={onRemove}
                disabled={busy}
              >
                {busy ? "Bezig…" : "Verwijderen"}
              </button>
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={styles.upload}
          onClick={() => setModalOpen(true)}
        >
          ＋ Ontwerp uploaden (PDF/JPG/PNG)
        </button>
      )}

      {warnings.length > 0 && (
        <ul className={styles.warnings}>
          {warnings.map((w) => (
            <li key={w} className={styles.warning}>
              <span aria-hidden="true">⚠︎</span> {w}
            </li>
          ))}
        </ul>
      )}

      <ArtworkUploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={onConfirm}
        widthCm={widthCm}
        heightCm={heightCm}
      />
    </div>
  );
}
