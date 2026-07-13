/**
 * Client-side preview-rasterisatie voor de drukproef: één keer de eerste
 * PDF-pagina (via pdf.js) of een gekozen afbeelding omzetten naar een
 * gedownschaalde PNG/JPEG data-URL. Die preview-afbeelding is puur voor
 * WEERGAVE (modal, winkelmand- en afreken-thumbnail via ArtworkProof) en
 * overleeft navigatie/reload omdat hij als string in de cart-state zit. Het
 * échte bestand (https-URL uit de upload, of de data-URL van het origineel in
 * de dev-fallback) blijft los hiervan de bestelbron.
 *
 * Alleen aanroepen vanaf de client (browser-API's: canvas, DOM).
 */

/** Langste zijde van de preview in px — scherp genoeg voor de grote modal. */
const PREVIEW_MAX_PX = 1000;

/** Bovengrens voor het opschalen van heel kleine PDF-pagina's. */
const MAX_PDF_SCALE = 10;

/**
 * Cache van reeds gerasterde PDF-bronnen (per src-URL). Voorkomt dubbel werk
 * wanneer dezelfde thumbnail vaker (re)rendert of op meerdere pagina's staat;
 * ook een mislukte poging (null) onthouden we, zodat een dode blob-URL niet
 * telkens opnieuw wordt geprobeerd.
 */
const pdfSrcRasterCache = new Map<string, string | null>();

/**
 * Rasteriseer de eerste pagina van een PDF die als URL beschikbaar is
 * (data:application/pdf, een https-URL uit de bucket, of een object-URL) naar
 * een PNG data-URL. Haalt de bytes op via `fetch` en hergebruikt
 * {@link rasterizePdfFirstPage}. Retourneert null (en cachet dat) wanneer de
 * bron onbereikbaar/onleesbaar is — bijv. een dode blob-URL van een oude
 * cart-regel; de aanroeper toont dan een nette placeholder.
 */
export async function rasterizePdfSrc(src: string): Promise<string | null> {
  const cached = pdfSrcRasterCache.get(src);
  if (cached !== undefined) return cached;
  let result: string | null = null;
  try {
    const res = await fetch(src);
    if (res.ok) {
      const blob = await res.blob();
      const file = new File([blob], "artwork.pdf", {
        type: "application/pdf",
      });
      result = await rasterizePdfFirstPage(file);
    }
  } catch {
    result = null;
  }
  pdfSrcRasterCache.set(src, result);
  return result;
}

/**
 * Render de eerste pagina van een PDF naar een PNG data-URL (max
 * {@link PREVIEW_MAX_PX} langste zijde). Retourneert null wanneer pdf.js of
 * het document niet meewerkt; de aanroeper valt dan terug op de <embed>.
 */
export async function rasterizePdfFirstPage(file: File): Promise<string | null> {
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
    try {
      const doc = await loadingTask.promise;
      const page = await doc.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const longest = Math.max(base.width, base.height);
      if (longest <= 0) return null;
      const scale = Math.min(PREVIEW_MAX_PX / longest, MAX_PDF_SCALE);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));
      await page.render({ canvas, viewport }).promise;
      return canvas.toDataURL("image/png");
    } finally {
      void loadingTask.destroy();
    }
  } catch {
    return null;
  }
}

/**
 * Schaal een reeds geladen afbeelding naar een compacte preview data-URL.
 * PNG behoudt transparantie; JPEG krijgt eerst een witte ondergrond (JPEG
 * kent geen alfakanaal — anders wordt transparant zwart).
 */
export function rasterizeImageElement(
  img: HTMLImageElement,
  kind: "png" | "jpeg",
): string | null {
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w <= 0 || h <= 0) return null;
    const scale = Math.min(1, PREVIEW_MAX_PX / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (kind === "jpeg") {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return kind === "png"
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", 0.88);
  } catch {
    return null;
  }
}
