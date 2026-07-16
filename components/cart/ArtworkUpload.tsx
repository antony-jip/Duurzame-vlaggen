"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { rasterizePdfSrc } from "@/lib/artwork/preview";
import { ArtworkUploadModal } from "./ArtworkUploadModal";
import { clientId, type CartDesign } from "./types";
import styles from "./ArtworkUpload.module.css";

/**
 * Design-toewijzingen van één winkelmandregel.
 *
 * Een regel draagt N designs; elk dekt een `quantity` van de regel ("2 van de
 * 6 met ontwerp A"). De snelle route blijft één klik: zonder toewijzing dekt
 * "Ontwerp uploaden" meteen de hele quantity. Daarna kan de klant splitsen
 * ("Nog een ontwerp" dekt de rest, steppers herverdelen) of slots parkeren als
 * "later aanleveren" (na het afrekenen aangeleverd via de portaallink in de
 * mail).
 *
 * De uploadflow zelf (sniff → sign → uploadToSignedUrl → finalize → drukproef)
 * leeft ongewijzigd in {@link ArtworkUploadModal}. Vervangen/verwijderde
 * bestanden worden best-effort opgeruimd via DELETE /api/artwork.
 */

type ModalTarget = { mode: "add" } | { mode: "replace"; designId: string };

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

function isImageDesign(design: CartDesign): boolean {
  return (
    /\.(jpe?g|png)$/i.test(design.fileName ?? "") ||
    /\.(jpe?g|png)$/i.test(design.fileUrl ?? "")
  );
}

/**
 * Thumbnail van één design: de voorbereide preview, anders de afbeelding
 * zelf, anders client-side de eerste PDF-pagina rasteren (zelfde route als de
 * enkelbestand-versie deed; gecachet per src in rasterizePdfSrc).
 */
function DesignThumb({ design }: { design: CartDesign }) {
  const isImage = isImageDesign(design);
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

  return (
    <a
      href={design.fileUrl!}
      target="_blank"
      rel="noreferrer"
      className={styles.preview}
      aria-label={`Ontwerp openen: ${design.fileName ?? "bestand"}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Voorbeeld van ${design.fileName ?? "je ontwerp"}`} />
      ) : (
        <span className={styles.pdfBadge}>PDF</span>
      )}
    </a>
  );
}

export function ArtworkUpload({
  itemId,
  amount,
  designs,
  widthCm,
  heightCm,
}: {
  itemId: string;
  /** Besteld aantal van de regel — waar de toewijzingen tegen optellen. */
  amount: number;
  designs: CartDesign[];
  widthCm?: number;
  heightCm?: number;
}) {
  const { setItemDesigns } = useCart();
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);

  const assigned = designs.reduce((sum, d) => sum + d.quantity, 0);
  const missing = Math.max(0, amount - assigned);
  const over = Math.max(0, assigned - amount);
  const complete = assigned === amount;

  function commit(next: CartDesign[]) {
    setItemDesigns(itemId, next);
  }

  function onModalConfirm(
    url: string,
    name: string,
    path: string,
    warnings: string[],
    preview: string | null,
  ) {
    if (!modalTarget) return;
    if (modalTarget.mode === "add") {
      commit([
        ...designs,
        {
          id: clientId(),
          quantity: Math.max(1, amount - assigned),
          fileUrl: url,
          fileName: name,
          filePath: path,
          fileWarnings: warnings,
          previewUrl: preview,
        },
      ]);
      return;
    }
    const target = designs.find((d) => d.id === modalTarget.designId);
    commit(
      designs.map((d) =>
        d.id === modalTarget.designId
          ? {
              ...d,
              fileUrl: url,
              fileName: name,
              filePath: path,
              fileWarnings: warnings,
              previewUrl: preview,
            }
          : d,
      ),
    );
    // Vervangen gelukt → ruim het zojuist vervangen bestand op.
    if (target?.filePath && target.filePath !== path) void deleteOrphan(target.filePath);
  }

  function addDeliverLater() {
    commit([
      ...designs,
      {
        id: clientId(),
        quantity: Math.max(1, amount - assigned),
        fileUrl: null,
        fileName: null,
        filePath: null,
        fileWarnings: [],
        previewUrl: null,
      },
    ]);
  }

  function removeDesign(design: CartDesign) {
    commit(designs.filter((d) => d.id !== design.id));
    if (design.filePath) void deleteOrphan(design.filePath);
  }

  function setQuantity(design: CartDesign, quantity: number) {
    const next = Math.max(1, Math.round(quantity));
    commit(designs.map((d) => (d.id === design.id ? { ...d, quantity: next } : d)));
  }

  // --- Lege staat: de snelle route -------------------------------------------

  if (designs.length === 0) {
    return (
      <div className={styles.wrap}>
        <button
          type="button"
          className={styles.upload}
          onClick={() => setModalTarget({ mode: "add" })}
        >
          ＋ Ontwerp uploaden (PDF/JPG/PNG)
        </button>
        <span className={styles.assignHint}>
          {amount > 1
            ? `Eén ontwerp voor alle ${amount} vlaggen. Meerdere ontwerpen? Upload ze één voor één en verdeel de aantallen.`
            : null}
          <button type="button" className={styles.link} onClick={addDeliverLater}>
            Ontwerp later aanleveren
          </button>
        </span>
        <ArtworkUploadModal
          open={modalTarget !== null}
          onClose={() => setModalTarget(null)}
          onConfirm={onModalConfirm}
          widthCm={widthCm}
          heightCm={heightCm}
        />
      </div>
    );
  }

  // --- Designlijst -------------------------------------------------------------

  return (
    <div className={styles.wrap}>
      <ul className={styles.designList}>
        {designs.map((design) => (
          <li key={design.id} className={styles.designRow}>
            {design.fileUrl ? (
              <DesignThumb design={design} />
            ) : (
              <span className={`${styles.preview} ${styles.previewLater}`} aria-hidden="true">
                ⏱
              </span>
            )}

            <div className={styles.designMeta}>
              <span className={styles.doneLabel}>
                {design.fileUrl ? (
                  design.fileWarnings.length > 0 ? (
                    <span className={styles.warnBadge} aria-hidden="true">
                      ⚠︎
                    </span>
                  ) : (
                    <span className={styles.check} aria-hidden="true">
                      ✓
                    </span>
                  )
                ) : null}
                <span className={styles.fileName}>
                  {design.fileUrl ? (design.fileName ?? "Ontwerp") : "Later aanleveren"}
                </span>
              </span>
              {!design.fileUrl && (
                <span className={styles.laterNote}>
                  Je ontvangt na het afrekenen een uploadlink per e-mail.
                </span>
              )}
              {design.fileWarnings.length > 0 && (
                <ul className={styles.warnings}>
                  {design.fileWarnings.map((w) => (
                    <li key={w} className={styles.warning}>
                      <span aria-hidden="true">⚠︎</span> {w}
                    </li>
                  ))}
                </ul>
              )}
              <span className={styles.doneActions}>
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => setModalTarget({ mode: "replace", designId: design.id })}
                >
                  {design.fileUrl ? "Vervangen" : "Nu uploaden"}
                </button>
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => removeDesign(design)}
                >
                  Verwijderen
                </button>
              </span>
            </div>

            {/* De verdeel-stepper is alleen zinvol bij een échte splitsing:
                één ontwerp dat de hele regel dekt volgt het regelaantal
                vanzelf, en een tweede stepper ernaast verwart alleen maar. */}
            {amount > 1 && (designs.length > 1 || design.quantity !== amount) && (
              <div
                className={styles.designQty}
                role="group"
                aria-label="Aantal vlaggen met dit ontwerp"
              >
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(design, design.quantity - 1)}
                  disabled={design.quantity <= 1}
                  aria-label="Minder vlaggen met dit ontwerp"
                >
                  −
                </button>
                <span className={styles.qtyValue} aria-live="polite">
                  {design.quantity}×
                </span>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(design, design.quantity + 1)}
                  disabled={missing === 0}
                  aria-label="Meer vlaggen met dit ontwerp"
                >
                  +
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {amount > 1 && (
        <div
          className={`${styles.assignStatus} ${
            complete
              ? styles.assignComplete
              : over > 0
                ? styles.assignError
                : styles.assignOpen
          }`}
          aria-live="polite"
        >
          {complete && <span aria-hidden="true">✓ </span>}
          {assigned} van {amount} toegewezen
          {over > 0 && ` · ${over} te veel: verlaag een aantal of verwijder een ontwerp`}
        </div>
      )}

      {missing > 0 && (
        <span className={styles.assignActions}>
          <button
            type="button"
            className={styles.upload}
            onClick={() => setModalTarget({ mode: "add" })}
          >
            ＋ Nog een ontwerp ({missing} vlag{missing === 1 ? "" : "gen"} open)
          </button>
          <button type="button" className={styles.link} onClick={addDeliverLater}>
            Rest later aanleveren
          </button>
        </span>
      )}

      <ArtworkUploadModal
        open={modalTarget !== null}
        onClose={() => setModalTarget(null)}
        onConfirm={onModalConfirm}
        widthCm={widthCm}
        heightCm={heightCm}
      />
    </div>
  );
}
