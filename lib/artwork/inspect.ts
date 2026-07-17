/**
 * Dimension / DPI / aspect-ratio analysis for customer artwork.
 *
 * Pure functions (`Uint8Array` / plain numbers in, no I/O) so they can run both
 * client-side and inside the route handler, and are unit-testable with tiny
 * hand-built byte fixtures.
 *
 * - PNG   pixel dimensions from the IHDR chunk.
 * - JPEG  pixel dimensions by scanning markers up to the first SOF (C0/C1/C2).
 * - PDF   physical dimensions from the first MediaBox (points → cm).
 *
 * The warning builder compares the artwork against the ordered flag size and
 * returns non-blocking Dutch warnings (low print resolution / aspect-ratio
 * mismatch).
 */

import type { ArtworkKind } from "./sniff";

const CM_PER_INCH = 2.54;
const PT_PER_INCH = 72;

/** Below this effective print resolution we warn the customer. */
const MIN_DPI = 30;
/** Aspect-ratio deviation above this fraction (3%) triggers a warning. */
const RATIO_TOLERANCE = 0.03;

// --- Raster dimension readers ------------------------------------------------

/**
 * Read PNG pixel dimensions from the IHDR chunk. Layout: 8-byte signature, then
 * a chunk (4-byte length, 4-byte "IHDR" type, then width/height as big-endian
 * uint32 at byte offsets 16 and 20). Returns null if the buffer is too short or
 * not a PNG-shaped header.
 */
export function readPngDimensions(
  bytes: Uint8Array,
): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  // Bytes 12..15 must spell "IHDR".
  if (
    bytes[12] !== 0x49 ||
    bytes[13] !== 0x48 ||
    bytes[14] !== 0x44 ||
    bytes[15] !== 0x52
  ) {
    return null;
  }
  const width = readUint32BE(bytes, 16);
  const height = readUint32BE(bytes, 20);
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

/**
 * Read JPEG pixel dimensions by walking the marker segments until the first
 * Start-Of-Frame (SOF0 = C0, SOF1 = C1, SOF2 = C2). In an SOF segment the two
 * bytes after `precision` are height then width (big-endian). Returns null if no
 * SOF is found within the buffer.
 */
export function readJpegDimensions(
  bytes: Uint8Array,
): { width: number; height: number } | null {
  // Must start with SOI (FF D8).
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 1 < bytes.length) {
    // Markers are 0xFF followed by a non-0xFF, non-0x00 byte; skip fill bytes.
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }
    let marker = bytes[offset + 1];
    // Skip any run of 0xFF padding.
    while (marker === 0xff && offset + 2 < bytes.length) {
      offset++;
      marker = bytes[offset + 1];
    }
    offset += 2;

    // Standalone markers without a length payload (RSTn, SOI, EOI, TEM).
    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      continue;
    }

    if (offset + 1 >= bytes.length) return null;
    const segmentLength = readUint16BE(bytes, offset);

    // SOF0 / SOF1 / SOF2 carry the frame dimensions.
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      // segment: [len(2)][precision(1)][height(2)][width(2)]...
      // Highest index read is offset+6 (width low byte).
      if (offset + 6 >= bytes.length) return null;
      const height = readUint16BE(bytes, offset + 3);
      const width = readUint16BE(bytes, offset + 5);
      if (width <= 0 || height <= 0) return null;
      return { width, height };
    }

    // Otherwise skip this segment's payload and continue.
    offset += segmentLength;
  }
  return null;
}

// --- PDF MediaBox reader -----------------------------------------------------

const MEDIABOX_RE =
  /MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/;

/**
 * Extract the first MediaBox from PDF text (a latin1 decode of head+tail chunks)
 * and convert its point-based size to centimetres. Returns null when no
 * MediaBox is present — the caller then simply accepts the file without a
 * dimension judgement.
 */
export function readPdfMediaBoxCm(
  text: string,
): { widthCm: number; heightCm: number } | null {
  const m = MEDIABOX_RE.exec(text);
  if (!m) return null;
  const x0 = Number(m[1]);
  const y0 = Number(m[2]);
  const x1 = Number(m[3]);
  const y1 = Number(m[4]);
  const widthPt = Math.abs(x1 - x0);
  const heightPt = Math.abs(y1 - y0);
  if (!(widthPt > 0) || !(heightPt > 0)) return null;
  return {
    widthCm: (widthPt / PT_PER_INCH) * CM_PER_INCH,
    heightCm: (heightPt / PT_PER_INCH) * CM_PER_INCH,
  };
}

/** Decode a byte buffer as latin1 (1 byte = 1 char) for PDF text scanning. */
export function bytesToLatin1(bytes: Uint8Array): string {
  let out = "";
  // Chunked to avoid call-stack limits on large buffers.
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return out;
}

// --- Warning builder ---------------------------------------------------------

export interface FlagSize {
  widthCm: number;
  heightCm: number;
}

export interface RasterInfo {
  kind: "png" | "jpeg";
  pixelWidth: number;
  pixelHeight: number;
}

export interface VectorInfo {
  kind: "pdf";
  /** Physical MediaBox size in cm, or null when no MediaBox was found. */
  widthCm: number;
  heightCm: number;
}

export type ArtworkInfo = RasterInfo | VectorInfo;

/** Effective print resolution in dots-per-inch for `pixels` across `cm`. */
export function effectiveDpi(pixels: number, cm: number): number {
  if (cm <= 0) return 0;
  return pixels / (cm / CM_PER_INCH);
}

/**
 * Minimum effective DPI of a raster design on a flag, matched op de
 * vlag-oriëntatie die het best bij de ontwerp-verhouding past — dezelfde
 * regel als `buildWarnings`, zodat elk DPI-getal in de UI hetzelfde rekent.
 */
export function minEffectiveDpi(
  pixelWidth: number,
  pixelHeight: number,
  flag: FlagSize,
): number {
  const devNormal = ratioDeviation(
    pixelWidth,
    pixelHeight,
    flag.widthCm,
    flag.heightCm,
  );
  const devRotated = ratioDeviation(
    pixelWidth,
    pixelHeight,
    flag.heightCm,
    flag.widthCm,
  );
  const rotated = devRotated < devNormal;
  const matchW = rotated ? flag.heightCm : flag.widthCm;
  const matchH = rotated ? flag.widthCm : flag.heightCm;
  return Math.min(
    effectiveDpi(pixelWidth, matchW),
    effectiveDpi(pixelHeight, matchH),
  );
}

/** Relative aspect-ratio deviation between two width:height pairs (0 = equal). */
function ratioDeviation(w1: number, h1: number, w2: number, h2: number): number {
  if (h1 <= 0 || h2 <= 0 || w2 <= 0) return Number.POSITIVE_INFINITY;
  const r1 = w1 / h1;
  const r2 = w2 / h2;
  return Math.abs(r1 - r2) / r2;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Render `a:b` as a tidy integer ratio, falling back to `x.xx:1` decimals. */
export function formatRatio(a: number, b: number): string {
  const ra = Math.round(a);
  const rb = Math.round(b);
  if (ra > 0 && rb > 0) {
    const g = gcd(ra, rb);
    const na = ra / g;
    const nb = rb / g;
    if (na <= 50 && nb <= 50) return `${na}:${nb}`;
  }
  return a >= b ? `${(a / b).toFixed(2)}:1` : `1:${(b / a).toFixed(2)}`;
}

/**
 * Compare the artwork against the ordered flag size and return non-blocking
 * Dutch warnings. Both flag orientations are considered; the one with the
 * smaller aspect-ratio deviation is used (a design may be laid out rotated
 * relative to the flag). When the flag size is unknown, no warnings are
 * produced.
 */
export function buildWarnings(
  info: ArtworkInfo,
  flag: FlagSize | null,
): string[] {
  if (!flag || flag.widthCm <= 0 || flag.heightCm <= 0) return [];
  const warnings: string[] = [];

  if (info.kind === "pdf") {
    // Vector: no DPI judgement, only aspect ratio on the physical MediaBox size.
    const dev = Math.min(
      ratioDeviation(info.widthCm, info.heightCm, flag.widthCm, flag.heightCm),
      ratioDeviation(info.widthCm, info.heightCm, flag.heightCm, flag.widthCm),
    );
    if (dev > RATIO_TOLERANCE) {
      warnings.push(ratioWarning(info.widthCm, info.heightCm, flag));
    }
    return warnings;
  }

  // Raster: pick the flag orientation that best matches the design ratio.
  const w = info.pixelWidth;
  const h = info.pixelHeight;
  const devNormal = ratioDeviation(w, h, flag.widthCm, flag.heightCm);
  const devRotated = ratioDeviation(w, h, flag.heightCm, flag.widthCm);
  const bestDev = Math.min(devNormal, devRotated);

  const dpi = minEffectiveDpi(w, h, flag);
  if (dpi < MIN_DPI) {
    warnings.push(
      `De resolutie is te laag voor scherp drukwerk op dit formaat (${Math.round(dpi)} dpi).`,
    );
  }
  if (bestDev > RATIO_TOLERANCE) {
    warnings.push(ratioWarning(w, h, flag));
  }
  return warnings;
}

function ratioWarning(w: number, h: number, flag: FlagSize): string {
  const design = formatRatio(w, h);
  const flagRatio = formatRatio(flag.widthCm, flag.heightCm);
  return `De verhouding van je ontwerp (${design}) wijkt af van de vlagmaat (${flagRatio}) — het ontwerp wordt geschaald of bijgesneden.`;
}

/**
 * Turn the fetched head (and, for PDF, tail) bytes into an {@link ArtworkInfo}.
 * `head`/`tail` are the raw Range-fetched chunks. Returns null when the
 * dimensions could not be determined (unreadable raster, or a PDF without a
 * MediaBox) — the caller treats that as "no dimension warnings".
 */
export function analyzeBytes(
  kind: ArtworkKind,
  head: Uint8Array,
  tail?: Uint8Array,
): ArtworkInfo | null {
  if (kind === "png") {
    const dims = readPngDimensions(head);
    return dims
      ? { kind: "png", pixelWidth: dims.width, pixelHeight: dims.height }
      : null;
  }
  if (kind === "jpeg") {
    const dims = readJpegDimensions(head);
    return dims
      ? { kind: "jpeg", pixelWidth: dims.width, pixelHeight: dims.height }
      : null;
  }
  // PDF: MediaBox can live near the start or the end, so scan head + tail.
  let text = bytesToLatin1(head);
  if (tail && tail.length > 0) text += bytesToLatin1(tail);
  const box = readPdfMediaBoxCm(text);
  return box
    ? { kind: "pdf", widthCm: box.widthCm, heightCm: box.heightCm }
    : null;
}

// --- byte helpers ------------------------------------------------------------

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] * 0x1000000 +
      (bytes[offset + 1] << 16) +
      (bytes[offset + 2] << 8) +
      bytes[offset + 3]) >>>
    0
  );
}
