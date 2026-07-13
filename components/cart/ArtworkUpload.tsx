"use client";

import { useRef, useState } from "react";
import { useCart } from "./CartProvider";
import styles from "./ArtworkUpload.module.css";

/**
 * Per-line artwork upload for the winkelmand. Posts the chosen file to
 * `/api/artwork`, which stores it in the public order-artwork bucket and returns
 * a public URL; that URL is saved on the cart line (`fileUrl`) and later handed
 * to Probo as `files:[{uri}]`. Purely presentational state — the source of
 * truth is the cart in localStorage.
 */
export function ArtworkUpload({
  itemId,
  fileUrl,
  fileName,
}: {
  itemId: string;
  fileUrl?: string | null;
  fileName?: string | null;
}) {
  const { setItemFile } = useCart();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/artwork", { method: "POST", body });
      const data = (await res.json()) as { url?: string; name?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Uploaden mislukt.");
        return;
      }
      setItemFile(itemId, data.url, data.name ?? file.name);
    } catch {
      setError("Uploaden mislukt. Controleer je verbinding.");
    } finally {
      setBusy(false);
    }
  }

  const isImage = /\.(jpe?g|png)$/i.test(fileName ?? "") || /\.(jpe?g|png)$/i.test(fileUrl ?? "");

  return (
    <div className={styles.wrap}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className={styles.input}
        onChange={onPick}
        aria-label="Ontwerpbestand uploaden"
      />
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
              <span className={styles.check} aria-hidden="true">
                ✓
              </span>
              <span className={styles.fileName}>{fileName ?? "Ontwerp"}</span>
            </span>
            <span className={styles.doneActions}>
              <button
                type="button"
                className={styles.link}
                onClick={() => inputRef.current?.click()}
                disabled={busy}
              >
                Vervangen
              </button>
              <button
                type="button"
                className={styles.link}
                onClick={() => setItemFile(itemId, null, null)}
                disabled={busy}
              >
                Verwijderen
              </button>
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={styles.upload}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Bezig met uploaden…" : "＋ Ontwerp uploaden (PDF/JPG/PNG)"}
        </button>
      )}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
