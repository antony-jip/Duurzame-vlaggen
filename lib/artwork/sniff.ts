/**
 * Magic-byte file sniffing for customer artwork (JPEG / PNG / PDF).
 *
 * Pure functions: `Uint8Array` in, no Node/browser deps, so they run
 * identically in the browser (fast pre-check on `file.slice(0, 16)`) and in the
 * route handler (authoritative check on the fetched head bytes) — and are
 * trivially unit-testable.
 *
 * The signatures we look for:
 *   PNG   89 50 4E 47 0D 0A 1A 0A
 *   JPEG  FF D8 FF
 *   PDF   25 50 44 46 2D            ("%PDF-")
 */

/** The three artwork kinds we accept, plus `null` for "unrecognised". */
export type ArtworkKind = "png" | "jpeg" | "pdf";
export type SniffResult = ArtworkKind | null;

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIG = [0xff, 0xd8, 0xff];
const PDF_SIG = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (bytes[i] !== sig[i]) return false;
  }
  return true;
}

/**
 * Detect the artwork kind from the leading bytes. Only the first ~8 bytes are
 * inspected, so a `file.slice(0, 16)` is plenty on the client.
 */
export function sniffKind(bytes: Uint8Array): SniffResult {
  if (startsWith(bytes, PNG_SIG)) return "png";
  if (startsWith(bytes, JPEG_SIG)) return "jpeg";
  if (startsWith(bytes, PDF_SIG)) return "pdf";
  return null;
}

/** Map a filename extension to the artwork kind it claims to be. */
export function kindFromFilename(name: string): SniffResult {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  if (ext === "png") return "png";
  if (ext === "jpg" || ext === "jpeg") return "jpeg";
  if (ext === "pdf") return "pdf";
  return null;
}

/** Map a MIME type to the artwork kind it claims to be. */
export function kindFromMime(mime: string): SniffResult {
  const normalized = mime.trim().toLowerCase();
  if (normalized === "image/png") return "png";
  if (normalized === "image/jpeg" || normalized === "image/jpg") return "jpeg";
  if (normalized === "application/pdf") return "pdf";
  return null;
}
