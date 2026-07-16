"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { rasterizePdfSrc } from "@/lib/artwork/preview";
import { sniffKind } from "@/lib/artwork/sniff";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ArtworkUploadModal } from "./ArtworkUploadModal";
import { clientId, type CartDesign } from "./types";
import styles from "./ArtworkUpload.module.css";

/**
 * Design-toewijzingen van één winkelmandregel.
 *
 * Een regel draagt N designs; elk dekt een `quantity` van de regel ("2 van de
 * 6 met ontwerp A"). Kiezen kan in bulk: de bestandskiezer accepteert meerdere
 * bestanden tegelijk (of een sleep met meerdere), elk bestand wordt een eigen
 * ontwerp en de aantallen worden automatisch verdeeld. Eén bestand loopt door
 * de drukproef-modal (kwaliteitscheck + snijlijnen); een batch gaat direct
 * door dezelfde sign → upload → finalize-API, met de kwaliteitswaarschuwingen
 * per ontwerp in de rij.
 *
 * Ook ná volledige dekking blijft splitsen mogelijk: een extra ontwerp pakt
 * 1 vlag af van het grootste bestaande ontwerp, waarna de steppers de
 * verdeling bijstellen. Vervangen/verwijderde bestanden worden best-effort
 * opgeruimd via DELETE /api/artwork.
 */

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB, spiegelt server + bucket
const BUCKET = "order-artwork";

type ModalTarget = { mode: "add" } | { mode: "replace"; designId: string };

interface BatchProgress {
  done: number;
  total: number;
}

interface UploadedFile {
  url: string;
  name: string;
  path: string;
  warnings: string[];
}

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

/**
 * Eén bestand door de bestaande upload-API (zelfde route als de modal):
 * client-sniff → sign → rechtstreeks naar Storage → finalize. Gooit met een
 * klantleesbare melding bij elke misser.
 */
async function uploadOne(
  file: File,
  size: { widthCm?: number; heightCm?: number },
): Promise<UploadedFile> {
  if (file.size > MAX_BYTES) throw new Error("te groot (max 50 MB)");

  const headBytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!sniffKind(headBytes)) throw new Error("geen geldige PDF, JPG of PNG");

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
    throw new Error(signData.error ?? "uploaden voorbereiden mislukt");
  }

  const supabase = createSupabaseBrowserClient();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(signData.path, signData.token, file, {
      contentType: file.type,
    });
  if (uploadError) throw new Error("uploaden mislukt");

  const finRes = await fetch("/api/artwork", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "finalize", path: signData.path, ...size }),
  });
  const finData = (await finRes.json()) as {
    url?: string;
    name?: string;
    warnings?: string[];
    error?: string;
  };
  if (!finRes.ok || !finData.url) {
    throw new Error(finData.error ?? "bestand kon niet worden verwerkt");
  }

  return {
    url: finData.url,
    name: finData.name ?? file.name,
    path: signData.path,
    warnings: finData.warnings ?? [],
  };
}

function isImageDesign(design: CartDesign): boolean {
  return (
    /\.(jpe?g|png)$/i.test(design.fileName ?? "") ||
    /\.(jpe?g|png)$/i.test(design.fileUrl ?? "")
  );
}

/**
 * Thumbnail van één design: de voorbereide preview, anders de afbeelding
 * zelf, anders client-side de eerste PDF-pagina rasteren (gecachet per src in
 * rasterizePdfSrc).
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
  // Bestand dat al gekozen is vóór de modal opent (enkel bestand uit de
  // multi-kiezer): de modal start er direct mee.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [batch, setBatch] = useState<BatchProgress | null>(null);
  const [batchNotes, setBatchNotes] = useState<string[]>([]);
  const multiInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const assigned = designs.reduce((sum, d) => sum + d.quantity, 0);
  const missing = Math.max(0, amount - assigned);
  const over = Math.max(0, assigned - amount);
  const complete = assigned === amount;
  // Hoeveel extra ontwerpen deze regel nog kwijt kan: de open vlaggen, of —
  // als alles gedekt is — de vlaggen die nog geen eigen ontwerp hebben.
  const capacity = missing > 0 ? missing : amount - designs.length;

  function commit(next: CartDesign[]) {
    setItemDesigns(itemId, next);
  }

  /** Voeg een geüpload bestand toe als design; bij volle dekking doneert het
   *  grootste ontwerp één vlag zodat de som blijft kloppen. */
  function designsWithUpload(
    base: CartDesign[],
    file: UploadedFile,
    preview: string | null,
  ): CartDesign[] | null {
    const baseAssigned = base.reduce((sum, d) => sum + d.quantity, 0);
    let working = base;
    let quantity = Math.max(1, amount - baseAssigned);
    if (baseAssigned >= amount) {
      const donor = [...base].sort((a, b) => b.quantity - a.quantity)[0];
      if (!donor || donor.quantity <= 1) return null; // elke vlag heeft al een eigen ontwerp
      working = base.map((d) =>
        d.id === donor.id ? { ...d, quantity: d.quantity - 1 } : d,
      );
      quantity = 1;
    }
    return [
      ...working,
      {
        id: clientId(),
        quantity,
        fileUrl: file.url,
        fileName: file.name,
        filePath: file.path,
        fileWarnings: file.warnings,
        previewUrl: preview,
      },
    ];
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
      const next = designsWithUpload(designs, { url, name, path, warnings }, preview);
      if (next) commit(next);
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

  /**
   * Batch: meerdere bestanden in één keer. Elk bestand wordt een eigen
   * ontwerp; de open vlaggen worden gelijk verdeeld (bij volle dekking pakt
   * elk nieuw ontwerp er één af van het grootste). Mislukte bestanden worden
   * overgeslagen met een melding, de rest gaat gewoon door.
   */
  async function uploadBatch(files: File[]) {
    const usable = files.slice(0, Math.max(0, capacity));
    const notes: string[] = [];
    if (usable.length < files.length) {
      notes.push(
        `${files.length - usable.length} bestand${files.length - usable.length === 1 ? "" : "en"} overgeslagen: meer ontwerpen dan vlaggen (${amount}).`,
      );
    }
    if (usable.length === 0) {
      setBatchNotes(notes);
      return;
    }

    setBatch({ done: 0, total: usable.length });
    setBatchNotes([]);

    const results: UploadedFile[] = [];
    for (const [i, file] of usable.entries()) {
      try {
        results.push(await uploadOne(file, { widthCm, heightCm }));
      } catch (err) {
        notes.push(
          `${file.name}: ${err instanceof Error ? err.message : "uploaden mislukt"}.`,
        );
      }
      setBatch({ done: i + 1, total: usable.length });
    }

    if (results.length > 0) {
      let next: CartDesign[] = designs;
      if (missing > 0) {
        // Verdeel de open vlaggen gelijkmatig; de eerste ontwerpen vangen de rest.
        const base = Math.floor(missing / results.length);
        const rest = missing % results.length;
        next = [
          ...next,
          ...results.map((file, i) => ({
            id: clientId(),
            quantity: base + (i < rest ? 1 : 0),
            fileUrl: file.url,
            fileName: file.name,
            filePath: file.path,
            fileWarnings: file.warnings,
            previewUrl: null,
          })),
        ];
      } else {
        for (const file of results) {
          const grown = designsWithUpload(next, file, null);
          if (!grown) break;
          next = grown;
        }
      }
      commit(next);
    }

    setBatch(null);
    setBatchNotes(notes);
  }

  /** Route gekozen bestanden: één → drukproef-modal, meerdere → batch. */
  function routeFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length === 0) return;
    if (files.length === 1) {
      setPendingFile(files[0]);
      setModalTarget({ mode: "add" });
      return;
    }
    void uploadBatch(files);
  }

  function onMultiPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) routeFiles(files);
    e.target.value = ""; // zelfde selectie opnieuw kiezen blijft mogelijk
  }

  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    },
    onDragLeave: () => setDragOver(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      routeFiles(e.dataTransfer.files);
    },
  };

  function closeModal() {
    setModalTarget(null);
    setPendingFile(null);
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

  const uploadBtnClass = `${styles.upload} ${dragOver ? styles.uploadDrag : ""}`;

  const picker = (
    <input
      ref={multiInputRef}
      type="file"
      multiple
      accept="image/jpeg,image/png,application/pdf"
      className={styles.input}
      onChange={onMultiPick}
      aria-label="Ontwerpbestanden kiezen"
    />
  );

  const batchStatus = (batch || batchNotes.length > 0) && (
    <div className={styles.batchStatus} role="status" aria-live="polite">
      {batch && (
        <span>
          Bezig met uploaden ({batch.done} van {batch.total})…
        </span>
      )}
      {batchNotes.map((n) => (
        <span key={n} className={styles.warning}>
          <span aria-hidden="true">⚠︎</span> {n}
        </span>
      ))}
    </div>
  );

  const modal = (
    <ArtworkUploadModal
      open={modalTarget !== null}
      onClose={closeModal}
      onConfirm={onModalConfirm}
      widthCm={widthCm}
      heightCm={heightCm}
      initialFile={pendingFile}
    />
  );

  // --- Lege staat: de snelle route -------------------------------------------

  if (designs.length === 0) {
    return (
      <div className={styles.wrap}>
        {picker}
        <button
          type="button"
          className={uploadBtnClass}
          onClick={() => multiInputRef.current?.click()}
          {...dropProps}
        >
          ＋ Ontwerp{amount > 1 ? "en" : ""} uploaden (PDF/JPG/PNG)
        </button>
        <span className={styles.assignHint}>
          {amount > 1
            ? `Kies of sleep gerust meerdere bestanden tegelijk; wij verdelen ze over je ${amount} vlaggen.`
            : null}
          <button type="button" className={styles.link} onClick={addDeliverLater}>
            Ontwerp later aanleveren
          </button>
        </span>
        {batchStatus}
        {modal}
      </div>
    );
  }

  // --- Designlijst -------------------------------------------------------------

  return (
    <div className={styles.wrap}>
      {picker}
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
                {design.fileUrl ? (
                  <button
                    type="button"
                    className={styles.link}
                    onClick={() => setModalTarget({ mode: "replace", designId: design.id })}
                  >
                    Vervangen
                  </button>
                ) : (
                  // Een openstaand slot alsnog vullen is de belangrijkste actie
                  // in de rij — dat is een echte knop, geen tekstlinkje.
                  <button
                    type="button"
                    className={styles.uploadNow}
                    onClick={() => setModalTarget({ mode: "replace", designId: design.id })}
                  >
                    ⬆ Nu uploaden
                  </button>
                )}
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

      {missing > 0 ? (
        <span className={styles.assignActions}>
          <button
            type="button"
            className={uploadBtnClass}
            onClick={() => multiInputRef.current?.click()}
            {...dropProps}
          >
            ＋ Nog een ontwerp ({missing} vlag{missing === 1 ? "" : "gen"} open)
          </button>
          <button type="button" className={styles.link} onClick={addDeliverLater}>
            Rest later aanleveren
          </button>
        </span>
      ) : (
        // Alles gedekt, maar splitsen moet mogelijk blijven: extra ontwerpen
        // pakken elk 1 vlag af van het grootste ontwerp. Zodra elke vlag zijn
        // eigen ontwerp heeft, valt er niets meer te verdelen.
        amount > 1 &&
        capacity > 0 && (
          <span className={styles.assignActions}>
            <button
              type="button"
              className={uploadBtnClass}
              onClick={() => multiInputRef.current?.click()}
              {...dropProps}
            >
              ＋ Ander ontwerp voor een deel van de vlaggen
            </button>
          </span>
        )
      )}

      {batchStatus}
      {modal}
    </div>
  );
}
