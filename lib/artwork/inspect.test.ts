import { describe, expect, it } from "vitest";
import {
  readPngDimensions,
  readJpegDimensions,
  readPdfMediaBoxCm,
  effectiveDpi,
  formatRatio,
  buildWarnings,
  analyzeBytes,
} from "@/lib/artwork/inspect";

// --- Fixtures ----------------------------------------------------------------

/** Build a minimal PNG header with the given IHDR width/height. */
function pngHeader(width: number, height: number): Uint8Array {
  const b = new Uint8Array(24);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0); // signature
  b.set([0x00, 0x00, 0x00, 0x0d], 8); // chunk length 13
  b.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
  b[16] = (width >>> 24) & 0xff;
  b[17] = (width >>> 16) & 0xff;
  b[18] = (width >>> 8) & 0xff;
  b[19] = width & 0xff;
  b[20] = (height >>> 24) & 0xff;
  b[21] = (height >>> 16) & 0xff;
  b[22] = (height >>> 8) & 0xff;
  b[23] = height & 0xff;
  return b;
}

/** Build a minimal JPEG (SOI + optional APP0 + SOF0) with given width/height. */
function jpegHeader(width: number, height: number, withApp0 = false): Uint8Array {
  const parts: number[] = [0xff, 0xd8]; // SOI
  if (withApp0) {
    // APP0 with a 4-byte payload (length = 6).
    parts.push(0xff, 0xe0, 0x00, 0x06, 0x4a, 0x46, 0x49, 0x46);
  }
  parts.push(
    0xff,
    0xc0, // SOF0
    0x00,
    0x11, // length 17
    0x08, // precision
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
  );
  return Uint8Array.from(parts);
}

// --- PNG ---------------------------------------------------------------------

describe("readPngDimensions", () => {
  it("reads width/height from the IHDR chunk", () => {
    expect(readPngDimensions(pngHeader(1200, 800))).toEqual({ width: 1200, height: 800 });
  });
  it("returns null for non-PNG / truncated buffers", () => {
    expect(readPngDimensions(new Uint8Array(10))).toBeNull();
    const noIhdr = pngHeader(100, 100);
    noIhdr[12] = 0x00; // corrupt "IHDR"
    expect(readPngDimensions(noIhdr)).toBeNull();
  });
});

// --- JPEG --------------------------------------------------------------------

describe("readJpegDimensions", () => {
  it("reads dimensions from SOF0", () => {
    expect(readJpegDimensions(jpegHeader(640, 480))).toEqual({ width: 640, height: 480 });
  });
  it("skips a preceding APP0 segment", () => {
    expect(readJpegDimensions(jpegHeader(1920, 1080, true))).toEqual({
      width: 1920,
      height: 1080,
    });
  });
  it("returns null when there is no SOF", () => {
    expect(readJpegDimensions(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]))).toBeNull();
    expect(readJpegDimensions(Uint8Array.from([0x00, 0x01]))).toBeNull();
  });
});

// --- PDF ---------------------------------------------------------------------

describe("readPdfMediaBoxCm", () => {
  it("converts an A4 MediaBox (points) to centimetres", () => {
    const box = readPdfMediaBoxCm("stuff /MediaBox [ 0 0 595.28 841.89 ] more");
    expect(box).not.toBeNull();
    expect(box!.widthCm).toBeCloseTo(21.0, 1);
    expect(box!.heightCm).toBeCloseTo(29.7, 1);
  });
  it("handles a non-zero origin", () => {
    const box = readPdfMediaBoxCm("/MediaBox[10 10 82 82]");
    expect(box!.widthCm).toBeCloseTo((72 / 72) * 2.54, 3);
  });
  it("returns null when no MediaBox is present", () => {
    expect(readPdfMediaBoxCm("no box here")).toBeNull();
  });
});

// --- DPI / ratio -------------------------------------------------------------

describe("effectiveDpi", () => {
  it("computes pixels per inch across a physical size", () => {
    // 2540 px over 100 cm = 1000 px over 100/2.54 in ≈ 25.4 in → 100 dpi.
    expect(effectiveDpi(2540, 100)).toBeCloseTo(64.5, 1);
    expect(effectiveDpi(0, 100)).toBe(0);
    expect(effectiveDpi(100, 0)).toBe(0);
  });
});

describe("formatRatio", () => {
  it("reduces to a tidy integer ratio", () => {
    expect(formatRatio(250, 100)).toBe("5:2");
    expect(formatRatio(3000, 2000)).toBe("3:2");
  });
  it("falls back to decimals for ugly ratios", () => {
    expect(formatRatio(1000, 333)).toContain(":1");
  });
});

// --- Warnings ----------------------------------------------------------------

describe("buildWarnings", () => {
  const flag = { widthCm: 250, heightCm: 100 };

  it("warns on low resolution", () => {
    const w = buildWarnings(
      { kind: "png", pixelWidth: 100, pixelHeight: 40 },
      flag,
    );
    expect(w.some((m) => m.includes("resolutie"))).toBe(true);
    // matching ratio (2.5) → no ratio warning
    expect(w.some((m) => m.includes("verhouding"))).toBe(false);
  });

  it("does not warn for a sharp, correctly-proportioned raster", () => {
    const w = buildWarnings(
      { kind: "jpeg", pixelWidth: 3000, pixelHeight: 1200 },
      flag,
    );
    expect(w).toEqual([]);
  });

  it("warns on aspect-ratio mismatch", () => {
    const w = buildWarnings(
      { kind: "png", pixelWidth: 1000, pixelHeight: 1000 },
      flag,
    );
    expect(w.some((m) => m.includes("verhouding"))).toBe(true);
  });

  it("prefers the better of the two orientations for the ratio check", () => {
    // Design is 100×250 (portrait), flag is 250×100 (landscape) — rotated match
    // is exact, so no ratio warning despite the raw ratio differing.
    const w = buildWarnings(
      { kind: "jpeg", pixelWidth: 1200, pixelHeight: 3000 },
      flag,
    );
    expect(w.some((m) => m.includes("verhouding"))).toBe(false);
  });

  it("for PDF only checks ratio, never DPI", () => {
    // Tiny physical size but correct ratio → no warning (vector, no DPI).
    const ok = buildWarnings({ kind: "pdf", widthCm: 25, heightCm: 10 }, flag);
    expect(ok).toEqual([]);
    // Wrong ratio → ratio warning.
    const bad = buildWarnings({ kind: "pdf", widthCm: 10, heightCm: 10 }, flag);
    expect(bad.some((m) => m.includes("verhouding"))).toBe(true);
  });

  it("returns no warnings when the flag size is unknown", () => {
    expect(buildWarnings({ kind: "png", pixelWidth: 10, pixelHeight: 10 }, null)).toEqual([]);
  });
});

// --- analyzeBytes ------------------------------------------------------------

describe("analyzeBytes", () => {
  it("wraps PNG dimensions", () => {
    expect(analyzeBytes("png", pngHeader(800, 600))).toEqual({
      kind: "png",
      pixelWidth: 800,
      pixelHeight: 600,
    });
  });
  it("wraps JPEG dimensions", () => {
    expect(analyzeBytes("jpeg", jpegHeader(640, 480))).toEqual({
      kind: "jpeg",
      pixelWidth: 640,
      pixelHeight: 480,
    });
  });
  it("reads a PDF MediaBox from head or tail bytes", () => {
    const head = new TextEncoder().encode("%PDF-1.4 no box in head");
    const tail = new TextEncoder().encode("/MediaBox [0 0 595.28 841.89]");
    const info = analyzeBytes("pdf", head, tail);
    expect(info?.kind).toBe("pdf");
  });
  it("returns null for unreadable input", () => {
    expect(analyzeBytes("png", new Uint8Array(4))).toBeNull();
    expect(analyzeBytes("pdf", new TextEncoder().encode("no box"))).toBeNull();
  });
});
