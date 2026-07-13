import { describe, expect, it } from "vitest";
import {
  sniffKind,
  kindFromFilename,
  kindFromMime,
} from "@/lib/artwork/sniff";

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const pdf = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // "%PDF-1.4"

describe("sniffKind", () => {
  it("detects PNG, JPEG and PDF magic bytes", () => {
    expect(sniffKind(png)).toBe("png");
    expect(sniffKind(jpeg)).toBe("jpeg");
    expect(sniffKind(pdf)).toBe("pdf");
  });

  it("returns null for unrecognised or too-short input", () => {
    expect(sniffKind(Uint8Array.from([0x00, 0x01, 0x02, 0x03]))).toBeNull();
    expect(sniffKind(Uint8Array.from([0x89, 0x50]))).toBeNull(); // truncated PNG
    expect(sniffKind(new Uint8Array())).toBeNull();
  });

  it("does not treat a near-miss signature as a match", () => {
    // PNG signature with the last byte wrong.
    const bad = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x00]);
    expect(sniffKind(bad)).toBeNull();
  });
});

describe("kindFromFilename", () => {
  it("maps extensions to kinds", () => {
    expect(kindFromFilename("design.png")).toBe("png");
    expect(kindFromFilename("PHOTO.JPG")).toBe("jpeg");
    expect(kindFromFilename("scan.jpeg")).toBe("jpeg");
    expect(kindFromFilename("proof.pdf")).toBe("pdf");
    expect(kindFromFilename("notes.txt")).toBeNull();
    expect(kindFromFilename("noextension")).toBeNull();
  });
});

describe("kindFromMime", () => {
  it("maps MIME types to kinds", () => {
    expect(kindFromMime("image/png")).toBe("png");
    expect(kindFromMime("image/jpeg")).toBe("jpeg");
    expect(kindFromMime("image/jpg")).toBe("jpeg");
    expect(kindFromMime("application/pdf")).toBe("pdf");
    expect(kindFromMime("text/plain")).toBeNull();
    expect(kindFromMime("")).toBeNull();
  });
});
