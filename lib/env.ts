/**
 * Typed environment access. Keeps test/prod separation honest and fails loudly
 * when a required variable is missing (build spec §2).
 *
 * - `serverEnv` values are read lazily and MUST NOT be imported into client
 *   components. They never carry a `NEXT_PUBLIC_` prefix and never reach the
 *   browser bundle.
 * - `publicEnv` values are safe for the client (they are `NEXT_PUBLIC_`).
 *
 * Reading is lazy (getters) so a missing var only throws when actually used,
 * not at module import — this keeps `next build` from failing on unrelated code.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in .env.local (dev) or the Vercel project settings (prod). See .env.example.`,
    );
  }
  return value;
}

/** Server-only secrets. Never import this into a client component. */
export const serverEnv = {
  // Probo — Reseller API (see §7). PROBO_API_KEY is already a base64 id:secret
  // token; request code prepends "Basic " — do not re-encode it.
  get proboApiKey() {
    return required("PROBO_API_KEY");
  },
  get proboSecurityToken() {
    return required("PROBO_SECURITY_TOKEN");
  },
  get proboApiBaseUrl() {
    // Verified base for the Reseller API.
    return process.env.PROBO_API_BASE_URL ?? "https://api.proboprints.com";
  },

  // Mollie — use test_... in dev, live_... in production.
  get mollieApiKey() {
    return required("MOLLIE_API_KEY");
  },

  // Supabase — privileged server key. Never exposed to the client.
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },

  // Admin back-office allowlist. Comma-separated staff e-mails that may sign in
  // to /admin. Returns a normalized (lowercased, trimmed) list; empty when unset
  // (which locks everyone out — set ADMIN_EMAILS to grant access).
  get adminEmails(): string[] {
    const raw = process.env.ADMIN_EMAILS;
    if (!raw) return [];
    return raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  },
} as const;

/** Public values — safe to reference in client and server code. */
export const publicEnv = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  /** Canonical app URL — used to build Mollie/Probo callback & return URLs. */
  get appUrl() {
    return required("NEXT_PUBLIC_APP_URL");
  },
} as const;
