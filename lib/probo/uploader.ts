import "server-only";

import type { UploaderResponse } from "./schemas";

/**
 * Uploader (white-label file upload) session creation.
 *
 * An order references uploaded artwork via `products[].uploaders: [{ id,
 * external_id }]`. Per Probo's "White label uploader" guide, a session is
 * created from a `calculation_id` and returns an `id` + `external_id` to store
 * for order completion:
 *
 *   request  → { calculation_id, callback_url?, language? }
 *   response → { status, id, external_id, calculation_id, callback_url, ... }
 *
 * HOWEVER: the exact endpoint path + HTTP method could NOT be confirmed. Every
 * probed path (`POST /uploaders`, `/uploader`, `/uploader/session`) returned
 * 404 on the live test API, and the docs do not state the route. Rather than
 * invent an endpoint, this is a typed, documented stub that throws when called.
 *
 * TODO: bevestig endpoint — confirm the real path/method with Probo (likely a
 * white-label uploader host distinct from api.proboprints.com) and implement
 * the call via `proboRequest` + `UploaderResponseSchema`.
 */

/** Input for {@link createUploaderSession}. */
export interface CreateUploaderSessionInput {
  /** The `calculation_id` from a configure/price call. */
  calculationId: string | number;
  /** URL Probo calls when the customer finishes uploading. */
  callbackUrl?: string;
  /** ISO language code for the uploader UI (e.g. "nl"). */
  language?: string;
}

/** Result of {@link createUploaderSession} — the refs an order needs. */
export interface CreateUploaderSessionResult {
  id: number;
  externalId: number;
  raw: unknown;
}

/**
 * Create an uploader session for a calculated product.
 *
 * @throws Always, until the endpoint is confirmed. See the module comment.
 */
export async function createUploaderSession(
  _input: CreateUploaderSessionInput,
): Promise<CreateUploaderSessionResult> {
  // Reference the response type so the intended shape stays wired up.
  const _shape: UploaderResponse | undefined = undefined;
  void _shape;
  throw new Error(
    "createUploaderSession is not implemented: the Probo uploader-session " +
      "endpoint path/method is unconfirmed (all probed routes 404'd). " +
      "Confirm the route with Probo, then wire it through proboRequest + " +
      "UploaderResponseSchema. See lib/probo/uploader.ts.",
  );
}
