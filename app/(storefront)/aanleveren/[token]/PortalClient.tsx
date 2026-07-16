"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArtworkUploadModal } from "@/components/cart/ArtworkUploadModal";
import { Card } from "@/components/ui";
import styles from "./portal.module.css";

/**
 * Client half of the delivery portal: per design assignment an upload/replace
 * action. The file itself goes browser → Storage via the existing
 * /api/artwork sign/finalize flow (inside {@link ArtworkUploadModal}); the
 * confirmed object is then bound to the design via POST /api/portal, which
 * also writes the order_events entry, notifies us, and advances the order when
 * it was the last missing file. After a successful attach we refresh the
 * server component so status/copy stay truthful.
 */

export interface PortalDesign {
  id: string;
  quantity: number;
  fileUrl: string | null;
  fileName: string | null;
  warnings: string[];
}

export interface PortalItem {
  id: string;
  name: string;
  sizeLabel: string | null;
  amount: number;
  widthCm?: number;
  heightCm?: number;
  designs: PortalDesign[];
}

export function PortalClient({
  token,
  items,
  editable,
}: {
  token: string;
  items: PortalItem[];
  editable: boolean;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<{ item: PortalItem; design: PortalDesign } | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm(
    url: string,
    name: string,
    path: string,
    warnings: string[],
    preview: string | null,
  ) {
    // De preview blijft client-side (mand); het portaal herlaadt de servervorm.
    void preview;
    if (!target) return;
    const designId = target.design.id;
    setBusyId(designId);
    setError(null);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "attach", token, designId, path, warnings }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Aanleveren mislukt. Probeer het opnieuw.");
        return;
      }
      // Server state changed (design, maybe order status) — re-render the page.
      router.refresh();
    } catch {
      setError("Aanleveren mislukt. Controleer je verbinding en probeer opnieuw.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={styles.items}>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {items.map((item) => (
        <Card key={item.id} className={styles.item} elevation="default">
          <div className={styles.itemHead}>
            <span className={styles.itemName}>{item.name}</span>
            <span className={styles.itemMeta}>
              {item.sizeLabel ? `${item.sizeLabel} · ` : ""}
              {item.amount}×
            </span>
          </div>

          <ul className={styles.designs}>
            {item.designs.map((design) => {
              const delivered = design.fileUrl !== null;
              const isImage = /\.(jpe?g|png)$/i.test(design.fileName ?? design.fileUrl ?? "");
              return (
                <li key={design.id} className={styles.design}>
                  {delivered ? (
                    <a
                      href={design.fileUrl!}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.thumb}
                      aria-label={`Ontwerp openen: ${design.fileName ?? "bestand"}`}
                    >
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={design.fileUrl!}
                          alt={`Voorbeeld van ${design.fileName ?? "je ontwerp"}`}
                        />
                      ) : (
                        <span className={styles.pdf}>PDF</span>
                      )}
                    </a>
                  ) : (
                    <span className={`${styles.thumb} ${styles.thumbOpen}`} aria-hidden="true">
                      ⏱
                    </span>
                  )}

                  <div className={styles.designMeta}>
                    <span className={styles.designName}>
                      {delivered ? (design.fileName ?? "Ontwerp") : "Nog aan te leveren"}
                    </span>
                    <span className={styles.designQty}>
                      Voor {design.quantity} {design.quantity === 1 ? "vlag" : "vlaggen"}
                    </span>
                    {design.warnings.length > 0 && (
                      <ul className={styles.warnings}>
                        {design.warnings.map((w) => (
                          <li key={w}>⚠︎ {w}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {editable ? (
                    <button
                      type="button"
                      className={delivered ? styles.replaceBtn : styles.uploadBtn}
                      onClick={() => setTarget({ item, design })}
                      disabled={busyId !== null}
                    >
                      {busyId === design.id
                        ? "Bezig…"
                        : delivered
                          ? "Vervangen"
                          : "Uploaden"}
                    </button>
                  ) : (
                    <span className={styles.locked}>
                      {delivered ? "✓ Binnen" : "Niet aangeleverd"}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      ))}

      <ArtworkUploadModal
        open={target !== null}
        onClose={() => setTarget(null)}
        onConfirm={onConfirm}
        widthCm={target?.item.widthCm}
        heightCm={target?.item.heightCm}
      />
    </div>
  );
}
