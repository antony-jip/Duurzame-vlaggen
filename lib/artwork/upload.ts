/**
 * Client-side artwork-upload door de bestaande upload-API — gedeelde helper
 * voor de winkelmand-uploader (components/cart/ArtworkUpload) en de
 * landenvlaggen-shop (automatisch gegenereerd drukbestand).
 *
 * Route (zie app/api/artwork/route.ts): client-sniff → sign (signed upload-URL)
 * → rechtstreeks naar Supabase Storage → finalize (magic-byte-check +
 * maat-analyse, geeft de publieke URL terug). Gooit bij elke misser een Error
 * met een klantleesbare Nederlandse melding.
 *
 * Browser-only (canvas/fetch/Supabase-browserclient), maar bewust zonder
 * "use client": het is geen component, en de importerende client-modules
 * trekken hem vanzelf de client-bundle in.
 */

import { sniffKind } from "@/lib/artwork/sniff";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Uploadlimiet in bytes — spiegelt server-route + bucket (50 MB). */
export const ARTWORK_MAX_BYTES = 50 * 1024 * 1024;

/** Publieke Storage-bucket voor klant-artwork. */
export const ARTWORK_BUCKET = "order-artwork";

export interface UploadedFile {
  /** Publieke URL in de order-artwork bucket. */
  url: string;
  /** Weergavenaam (oorspronkelijke bestandsnaam). */
  name: string;
  /** Storage-key (`${uuid}-${safeName}`), nodig om te wissen bij vervangen. */
  path: string;
  /** Niet-blokkerende kwaliteitswaarschuwingen uit de uploadcheck. */
  warnings: string[];
}

/**
 * Eén bestand door de upload-API: sniff → sign → uploadToSignedUrl → finalize.
 * `size` (cm) laat de server resolutie en beeldverhouding toetsen tegen de
 * bestelde vlagmaat; de uitkomst komt als `warnings` terug.
 */
export async function uploadOne(
  file: File,
  size: { widthCm?: number; heightCm?: number },
): Promise<UploadedFile> {
  if (file.size > ARTWORK_MAX_BYTES) throw new Error("te groot (max 50 MB)");

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
    .from(ARTWORK_BUCKET)
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

/**
 * Best-effort verwijderen van een uploadbestand dat niet meer gebruikt wordt;
 * achterblijvers veegt scripts/cleanup-artwork.ts op.
 */
export async function deleteOrphan(path: string): Promise<void> {
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
