"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { rasterizePdfSrc } from "@/lib/artwork/preview";
import { sniffKind } from "@/lib/artwork/sniff";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ArtworkUploadModal } from "./ArtworkUploadModal";
import type { ProofFinish } from "./ArtworkProof";
import { clientId, type CartDesign } from "./types";
import styles from "./ArtworkUpload.module.css";

/**
 * Ontwerpen van één winkelmandregel — naar het model van een echte
 * bestel-uploader: de regel toont alleen een compacte samenvatting (mini's +
 * "x van y toegewezen") met één knop ("Start met uploaden" / "Ontwerpen
 * bekijken"); ALLES verder gebeurt in de schermvullende editor. Daar wissel je
 * tussen ontwerpen (strip onderin, ‹ ›), voeg je bestanden toe (＋, meerdere
 * tegelijk), verdeel je de aantallen en vervang of verwijder je een ontwerp.
 *
 * Eén bestand = hetzelfde ontwerp op alle vlaggen van de regel (de normale
 * route); meerdere bestanden worden automatisch over de vlaggen verdeeld.
 * "Later aanleveren" kan per (deel)ontwerp; die klant krijgt na het afrekenen
 * een uploadlink per e-mail.
 */

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB, spiegelt server + bucket
const BUCKET = "order-artwork";

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
 * Mini van één design op de mandregel: de voorbereide preview, anders de
 * afbeelding zelf, anders client-side de eerste PDF-pagina rasteren (gecachet
 * in rasterizePdfSrc). Klik = editor openen op dit ontwerp.
 */
function DesignMini({
  design,
  amount,
  onOpen,
}: {
  design: CartDesign;
  amount: number;
  onOpen: () => void;
}) {
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
    <button
      type="button"
      className={styles.miniTile}
      onClick={onOpen}
      aria-label={
        design.fileUrl
          ? `Ontwerp ${design.fileName ?? ""} bekijken (${design.quantity} van ${amount})`
          : `Later aanleveren (${design.quantity} van ${amount})`
      }
    >
      {design.fileUrl ? (
        src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" />
        ) : (
          <span className={styles.railDoc} aria-hidden="true">
            PDF
          </span>
        )
      ) : (
        <span className={styles.railLater} aria-hidden="true">
          ⏱
        </span>
      )}
      {amount > 1 && <span className={styles.railQty}>{design.quantity}×</span>}
      {design.fileWarnings.length > 0 && (
        <span className={styles.miniWarn} aria-hidden="true">
          ⚠︎
        </span>
      )}
    </button>
  );
}

export function ArtworkUpload({
  itemId,
  amount,
  designs,
  widthCm,
  heightCm,
  finish,
}: {
  itemId: string;
  /** Besteld aantal van de regel — waar de toewijzingen tegen optellen. */
  amount: number;
  designs: CartDesign[];
  widthCm?: number;
  heightCm?: number;
  /** Afwerkingszone (tunnel/band/ringen) voor de drukproef, indicatief. */
  finish?: ProofFinish;
}) {
  const { setItemDesigns } = useCart();
  // Editor open? In beheer-modus (designs aanwezig) wijst activeId het actieve
  // ontwerp in de strip aan; pendingFile stuurt de eerste upload de drukproef in.
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [batch, setBatch] = useState<BatchProgress | null>(null);
  const [batchNotes, setBatchNotes] = useState<string[]>([]);
  const multiInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const assigned = designs.reduce((sum, d) => sum + d.quantity, 0);
  const missing = Math.max(0, amount - assigned);
  const over = Math.max(0, assigned - amount);
  const complete = assigned === amount;

  function commit(next: CartDesign[]) {
    setItemDesigns(itemId, next);
  }

  function openEditorAt(id: string | null) {
    setActiveId(id ?? designs[0]?.id ?? null);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setPendingFile(null);
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

  /**
   * "Opslaan" in de editor: het bevestigde bestand hoort bij het actieve
   * ontwerp (vervangen of een later-slot vullen). Zonder actief ontwerp (eerste
   * upload op een lege regel) wordt het een nieuw design over de hele regel.
   */
  function onModalConfirm(
    url: string,
    name: string,
    path: string,
    warnings: string[],
    preview: string | null,
  ) {
    const target = activeId ? designs.find((d) => d.id === activeId) : undefined;
    if (!target) {
      const next = designsWithUpload(designs, { url, name, path, warnings }, preview);
      if (next) commit(next);
      return;
    }
    // Ongewijzigd opgeslagen (zelfde bestand): niets te doen.
    if (target.filePath === path && target.fileUrl === url) return;
    commit(
      designs.map((d) =>
        d.id === target.id
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
    if (target.filePath && target.filePath !== path) void deleteOrphan(target.filePath);
  }

  /**
   * Batch: meerdere bestanden in één keer. Elk bestand wordt een eigen
   * ontwerp; de open vlaggen worden gelijk verdeeld (bij volle dekking pakt
   * elk nieuw ontwerp er één af van het grootste). Mislukte bestanden worden
   * overgeslagen met een melding, de rest gaat gewoon door.
   */
  async function uploadBatch(files: File[]) {
    const capacity = missing > 0 ? missing : amount - designs.length;
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
      let firstNewId: string | null = null;
      if (missing > 0) {
        // Verdeel de open vlaggen gelijkmatig; de eerste ontwerpen vangen de rest.
        const base = Math.floor(missing / results.length);
        const rest = missing % results.length;
        const nieuwe = results.map((file, i) => ({
          id: clientId(),
          quantity: base + (i < rest ? 1 : 0),
          fileUrl: file.url,
          fileName: file.name,
          filePath: file.path,
          fileWarnings: file.warnings,
          previewUrl: null,
        }));
        firstNewId = nieuwe[0]?.id ?? null;
        next = [...next, ...nieuwe];
      } else {
        for (const file of results) {
          const grown = designsWithUpload(next, file, null);
          if (!grown) break;
          next = grown;
          firstNewId ??= grown[grown.length - 1].id;
        }
      }
      commit(next);
      if (firstNewId) setActiveId(firstNewId);
    }

    setBatch(null);
    setBatchNotes(notes);
  }

  /** Route gekozen bestanden: één → drukproef in de editor, meerdere → batch. */
  function routeFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length === 0) return;
    if (files.length === 1 && designs.length === 0) {
      // Eerste bestand op een lege regel: meteen de drukproef in.
      setPendingFile(files[0]);
      setActiveId(null);
      setEditorOpen(true);
      return;
    }
    void uploadBatch(files).then(() => setEditorOpen(true));
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

  function addDeliverLater() {
    const nieuw: CartDesign = {
      id: clientId(),
      quantity: Math.max(1, amount - assigned),
      fileUrl: null,
      fileName: null,
      filePath: null,
      fileWarnings: [],
      previewUrl: null,
    };
    commit([...designs, nieuw]);
    return nieuw.id;
  }

  function removeDesign(id: string) {
    const design = designs.find((d) => d.id === id);
    const rest = designs.filter((d) => d.id !== id);
    commit(rest);
    if (design?.filePath) void deleteOrphan(design.filePath);
    if (rest.length === 0) {
      closeEditor();
    } else if (activeId === id) {
      setActiveId(rest[0].id);
    }
  }

  function setQuantity(id: string, quantity: number) {
    const next = Math.max(1, Math.round(quantity));
    commit(designs.map((d) => (d.id === id ? { ...d, quantity: next } : d)));
  }

  const uploadBtnClass = `${styles.uploadNow} ${dragOver ? styles.uploadDrag : ""}`;

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
      open={editorOpen}
      onClose={closeEditor}
      onConfirm={onModalConfirm}
      widthCm={widthCm}
      heightCm={heightCm}
      initialFile={pendingFile}
      finish={finish}
      beheer={
        designs.length > 0
          ? {
              designs,
              amount,
              activeId,
              onSelect: setActiveId,
              onQuantity: setQuantity,
              onRemove: removeDesign,
              onAddFiles: (files) => void uploadBatch(Array.from(files)),
              onDeliverLater: () => setActiveId(addDeliverLater()),
              busyNote: batch
                ? `Bezig met uploaden (${batch.done} van ${batch.total})…`
                : null,
            }
          : undefined
      }
    />
  );

  // --- Lege regel: één duidelijke startknop (alles verder in de editor) ------

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
          ⬆ Start met uploaden
        </button>
        <span className={styles.assignHint}>
          {amount > 1
            ? `Eén bestand? Dan komt hetzelfde ontwerp op alle ${amount} vlaggen. Meerdere bestanden verdelen we automatisch.`
            : "PDF, JPG of PNG · max 50 MB."}
          <button
            type="button"
            className={styles.link}
            onClick={() => void addDeliverLater()}
          >
            Ontwerp later aanleveren
          </button>
        </span>
        {batchStatus}
        {modal}
      </div>
    );
  }

  // --- Regel met ontwerpen: compacte samenvatting + één knop ------------------

  return (
    <div className={styles.wrap}>
      {picker}
      <div className={styles.miniStrip}>
        {designs.map((design) => (
          <DesignMini
            key={design.id}
            design={design}
            amount={amount}
            onOpen={() => openEditorAt(design.id)}
          />
        ))}
      </div>

      <span className={styles.assignActions}>
        <button
          type="button"
          className={styles.uploadNow}
          onClick={() => openEditorAt(designs[0]?.id ?? null)}
        >
          Ontwerpen bekijken{missing > 0 ? " en aanvullen" : ""}
        </button>
        {amount > 1 && (
          <span
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
            {over > 0 && ` · ${over} te veel`}
          </span>
        )}
      </span>

      {batchStatus}
      {modal}
    </div>
  );
}
