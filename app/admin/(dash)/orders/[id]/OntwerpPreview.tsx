"use client";

import { useEffect, useState } from "react";
import styles from "../../admin.module.css";
import { rasterizePdfSrc } from "@/lib/artwork/preview";

/**
 * Toont het aangeleverde ontwerp als echt beeld, ook wanneer het een PDF is.
 *
 * De admin liet voor een PDF alleen een rood "PDF"-blokje zien, dus moest je het
 * bestand eerst downloaden om te zien wát je ging inkopen. pdf.js rastert de
 * eerste pagina client-side; `rasterizePdfSrc` cachet per URL, dus meerdere
 * regels met hetzelfde bestand kosten één keer werk.
 *
 * Client-component: het rasteren gebruikt canvas en DOM.
 */

const IS_AFBEELDING = /\.(png|jpe?g|webp)$/i;

type Staat =
  | { fase: "beeld"; src: string }
  | { fase: "bezig" }
  | { fase: "mislukt" };

export function OntwerpPreview({ fileUrl }: { fileUrl: string }) {
  const isAfbeelding = IS_AFBEELDING.test(fileUrl);
  const [staat, setStaat] = useState<Staat>(
    isAfbeelding ? { fase: "beeld", src: fileUrl } : { fase: "bezig" },
  );

  useEffect(() => {
    if (isAfbeelding) return;

    let afgebroken = false;
    void rasterizePdfSrc(fileUrl).then((dataUrl) => {
      if (afgebroken) return;
      setStaat(dataUrl ? { fase: "beeld", src: dataUrl } : { fase: "mislukt" });
    });
    return () => {
      afgebroken = true;
    };
  }, [fileUrl, isAfbeelding]);

  if (staat.fase === "bezig") {
    return (
      <div className={styles.previewSkelet} aria-label="Voorbeeld wordt geladen">
        <span className={styles.previewSkeletTekst}>PDF laden…</span>
      </div>
    );
  }

  // Rasteren mislukt (onleesbare of te exotische PDF) → val terug op de badge,
  // want de download eronder werkt dan nog wél.
  if (staat.fase === "mislukt") {
    return (
      <div className={styles.previewSkelet}>
        <span className={styles.artworkDoc} aria-hidden="true">
          PDF
        </span>
        <span className={styles.previewSkeletTekst}>Geen voorbeeld</span>
      </div>
    );
  }

  return (
    // Openen in een tab: de download-link ernaast is voor de studio, dit is om
    // het ontwerp even groot te bekijken.
    <a
      href={fileUrl}
      target="_blank"
      rel="noreferrer"
      className={styles.previewLink}
      title="Ontwerp op ware grootte openen"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={staat.src} alt="Aangeleverd ontwerp" className={styles.previewBeeld} />
    </a>
  );
}
