import "server-only";

/**
 * Minimal typed fetch helper for the Probo & Mollie integration clients.
 * Native `fetch` (Node 24) — no SDK. Adds a timeout, JSON encode/decode, and a
 * rich error that carries the HTTP status + response body so failures are
 * debuggable server-side. The caller validates the parsed body with zod.
 */

export class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Extra headers merged on top of Accept/Content-Type. */
  headers?: Record<string, string>;
  /** Parsed and sent as JSON. Omit for GET. */
  json?: unknown;
  /** Raw string body (e.g. application/x-www-form-urlencoded). Overrides `json`. */
  body?: string;
  /** Request timeout in ms (default 20s). */
  timeoutMs?: number;
  /** AbortSignal to compose with the internal timeout. */
  signal?: AbortSignal;
}

/**
 * Perform an HTTP request and return the parsed JSON body as `unknown`.
 * Throws {@link HttpError} on a non-2xx response or a network/timeout failure.
 */
export async function requestJson(
  url: string,
  options: RequestOptions = {},
): Promise<unknown> {
  const {
    method = "GET",
    headers = {},
    json,
    body,
    timeoutMs = 20_000,
    signal,
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };
  let payload: string | undefined = body;
  if (payload === undefined && json !== undefined) {
    payload = JSON.stringify(json);
    finalHeaders["Content-Type"] ??= "application/json";
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: payload,
      signal: controller.signal,
    });
  } catch (cause) {
    clearTimeout(timeout);
    const reason = controller.signal.aborted ? `timed out after ${timeoutMs}ms` : "network error";
    throw new HttpError(`${method} ${url} failed (${reason})`, 0, cause);
  }
  clearTimeout(timeout);

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    throw new HttpError(`${method} ${url} → HTTP ${response.status}`, response.status, parsed);
  }

  return parsed;
}
