/**
 * Storage-path validation for the order-artwork bucket.
 *
 * Every artwork object is keyed `${uuid}-${safeName}` at the bucket root (no
 * sub-folders). The finalize/delete endpoints accept a client-supplied path, so
 * we must confirm it has that exact shape before touching Storage: it must start
 * with a v4-style UUID and contain no path traversal (`/` or `..`).
 */

const UUID_PREFIX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;

/** True when `path` is a well-formed order-artwork object key. */
export function isValidArtworkPath(path: unknown): path is string {
  if (typeof path !== "string" || path.length === 0 || path.length > 200) {
    return false;
  }
  if (path.includes("/") || path.includes("..") || path.includes("\\")) {
    return false;
  }
  return UUID_PREFIX.test(path);
}

/** Sanitise an original filename into a short, ASCII-safe path suffix. */
export function safeNameSuffix(name: string, fallbackExt: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-60);
  return cleaned || `artwork.${fallbackExt}`;
}
