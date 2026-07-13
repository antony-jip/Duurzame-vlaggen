import "server-only";

import { serverEnv } from "@/lib/env";
import { requestJson, type RequestOptions } from "@/lib/http";

/**
 * Low-level HTTP client for the Probo Reseller API.
 *
 * Every call goes through {@link proboRequest}, which prepends the configured
 * base URL and attaches the `Authorization: Basic <token>` header. The token in
 * `PROBO_API_KEY` is already a base64-encoded `id:secret` pair — we send it
 * verbatim and never re-encode it.
 *
 * The base URL is verified against the live Reseller API
 * (`https://api.proboprints.com`). Endpoints used by this module (all verified
 * live): `GET /products`, `POST /products/configure`, `POST /price`,
 * `POST /order`, `POST /order/status`.
 */

/** Build an absolute Probo API URL from a path (leading slash optional). */
export function proboUrl(path: string): string {
  const base = serverEnv.proboApiBaseUrl.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

/**
 * Perform an authenticated request against the Probo API and return the parsed
 * JSON body as `unknown`. The caller validates the shape with a zod schema.
 *
 * Throws {@link import("@/lib/http").HttpError} on a non-2xx response or a
 * network/timeout failure — the error carries `.status` and `.body`.
 */
export function proboRequest(
  path: string,
  options: RequestOptions = {},
): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Basic ${serverEnv.proboApiKey}`,
    ...options.headers,
  };
  return requestJson(proboUrl(path), { ...options, headers });
}
