/**
 * Client-side rendering van een landenvlag-SVG naar een drukklaar PNG-bestand.
 *
 * De 4x3-SVG (uit public/flags/, zie scripts/sync-flag-icons.mjs) wordt op een
 * canvas getekend en als PNG geëxporteerd: minimaal 3000 px breed, en breder
 * wanneer de bestelde vlagmaat dat vraagt om boven de 30 DPI-drempel van de
 * artwork-check te blijven. Beeldverhouding blijft 4:3 (de standaard van
 * flag-icons); geen witte achtergrond nodig, het doek dekt het hele vlak.
 *
 * Browser-only (canvas + Image); alleen aanroepen vanuit client-componenten.
 */

import { vlagSrc } from "./landen";

/** Ondergrens in pixels — ruim drukklaar voor de kleinere maten. */
const MIN_WIDTH_PX = 3000;

/**
 * Doelresolutie t.o.v. de bestelde maat. De artwork-check waarschuwt onder
 * 30 DPI; 31 geeft marge tegen afronding.
 */
const TARGET_DPI = 31;
const CM_PER_INCH = 2.54;

/**
 * Render de vlag van `code` naar een PNG-`File` met de gegeven bestandsnaam.
 * `widthCm` = breedte van de bestelde mastvlag, stuurt de pixelbreedte.
 */
export async function renderLandenvlagPng(
  code: string,
  bestandsnaam: string,
  widthCm: number,
): Promise<File> {
  const res = await fetch(vlagSrc(code));
  if (!res.ok) throw new Error("vlagbestand laden mislukt");
  let svg = await res.text();

  const width = Math.max(
    MIN_WIDTH_PX,
    Math.ceil((widthCm / CM_PER_INCH) * TARGET_DPI),
  );
  const height = Math.round((width * 3) / 4);

  // flag-icons-SVG's hebben alleen een viewBox (640×480). Zonder expliciete
  // width/height rendert drawImage ze in sommige browsers op de fallback-maat
  // (of helemaal niet), dus we schrijven de doelmaat in de svg-tag zelf.
  svg = svg.replace(/<svg\b/, `<svg width="${width}" height="${height}"`);

  const blobUrl = URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml" }),
  );
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = blobUrl;
    await img.decode();

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas niet beschikbaar");
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("PNG maken mislukt");

    return new File([blob], bestandsnaam, { type: "image/png" });
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
