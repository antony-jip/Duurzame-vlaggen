/**
 * Minimale ZIP-schrijver (methode "store", geen compressie) — genoeg om alle
 * ontwerpen van een order als één download te bundelen zonder een
 * archiveer-dependency. PDF/JPG/PNG zijn zelf al gecomprimeerd, dus deflate
 * zou toch niets opleveren.
 *
 * Implementatie volgt de PKZIP-specificatie (APPNOTE): per bestand een local
 * file header + data, daarna de central directory en de end-of-central-
 * directory record. Bestandsnamen worden als UTF-8 geschreven (vlag bit 11).
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** MS-DOS datum/tijd-velden zoals ZIP ze wil (2-seconden-resolutie). */
function dosDateTime(d: Date): { time: number; date: number } {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date:
      ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

export interface ZipEntry {
  /** Pad in het archief, met "/" als scheidingsteken. */
  name: string;
  data: Uint8Array;
}

/** Bouw een compleet ZIP-archief (store-only) uit de gegeven bestanden. */
export function buildZip(entries: ZipEntry[], now: Date = new Date()): Uint8Array {
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime(now);

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); // local file header signature
    local.setUint16(4, 20, true); // version needed
    local.setUint16(6, 0x0800, true); // flags: UTF-8 names
    local.setUint16(8, 0, true); // method: store
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true); // compressed
    local.setUint32(22, size, true); // uncompressed
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true); // extra length

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true); // central directory signature
    central.setUint16(4, 20, true); // version made by
    central.setUint16(6, 20, true); // version needed
    central.setUint16(8, 0x0800, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, time, true);
    central.setUint16(14, date, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, size, true);
    central.setUint32(24, size, true);
    central.setUint16(28, name.length, true);
    // extra/comment/disk/attrs = 0
    central.setUint32(42, offset, true); // local header offset

    localParts.push(new Uint8Array(local.buffer), name, entry.data);
    centralParts.push(new Uint8Array(central.buffer), name);
    offset += 30 + name.length + size;
  }

  const centralSize = centralParts.reduce((sum, p) => sum + p.length, 0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true); // end of central directory
  eocd.setUint16(8, entries.length, true); // entries on this disk
  eocd.setUint16(10, entries.length, true); // entries total
  eocd.setUint32(12, centralSize, true);
  eocd.setUint32(16, offset, true); // central directory offset

  const total =
    offset + centralSize + 22;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const part of [...localParts, ...centralParts, new Uint8Array(eocd.buffer)]) {
    out.set(part, pos);
    pos += part.length;
  }
  return out;
}
