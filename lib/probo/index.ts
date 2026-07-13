import "server-only";

/**
 * Public entry point for the Probo Reseller API integration.
 *
 * Import the normalised helpers from here (`@/lib/probo`) rather than reaching
 * into individual files. Low-level `proboRequest` and the zod schemas are also
 * re-exported for advanced/debugging use.
 */

// Low-level client.
export { proboRequest, proboUrl } from "./client";

// Catalogue, configuration & pricing.
export {
  getProducts,
  configureProduct,
  getPrice,
  type GetProductsResult,
  type ConfigureInput,
  type ConfigureResult,
  type PriceInput,
  type PriceResult,
  type ProboAddress,
  type ProboOptionInput,
  type ProboProductInput,
  type ProboDeliveryInput,
} from "./products";

// Orders & status.
export {
  createProboOrder,
  getProboOrderStatus,
  type CreateProboOrderInput,
  type CreateProboOrderResult,
  type ProboOrderProductInput,
  type ProboOrderStatusResult,
} from "./orders";

// Uploader (stub — endpoint unconfirmed).
export {
  createUploaderSession,
  type CreateUploaderSessionInput,
  type CreateUploaderSessionResult,
} from "./uploader";

// Callback verification.
export {
  verifyProboCallback,
  type VerifyProboCallbackResult,
} from "./callbacks";

// Schemas & inferred types.
export * from "./schemas";
