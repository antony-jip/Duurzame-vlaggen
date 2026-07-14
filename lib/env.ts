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

function required(name: string, value = process.env[name]): string {
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

  // Resend — transactional e-mail (materiaalpaspoort). OPTIONAL: unset ⇒ the
  // paspoort-mail is skipped (logged) rather than crashing the order flow.
  // Returns null when unset so callers can degrade gracefully.
  get resendApiKey(): string | null {
    return process.env.RESEND_API_KEY?.trim() || null;
  },
  // Afzender voor uitgaande e-mail, bijv. `Duurzame Vlaggen <hello@duurzame-vlaggen.nl>`.
  // Valt terug op een net standaardadres wanneer MAIL_FROM niet is gezet.
  get mailFrom(): string {
    return (
      process.env.MAIL_FROM?.trim() ||
      "Duurzame Vlaggen <hello@duurzame-vlaggen.nl>"
    );
  },
} as const;

/**
 * Public values — safe to reference in client and server code.
 *
 * Client bundles only receive NEXT_PUBLIC_ vars where Next.js can inline a
 * LITERAL `process.env.NEXT_PUBLIC_X` expression at compile time — a dynamic
 * `process.env[name]` lookup stays undefined in the browser. Hence each getter
 * passes the literal read into `required` instead of letting it look the var
 * up by name.
 */
export const publicEnv = {
  get supabaseUrl() {
    return required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get supabaseAnonKey() {
    return required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
  /** Canonical app URL — used to build Mollie/Probo callback & return URLs. */
  get appUrl() {
    return required("NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL);
  },
} as const;

/**
 * Fulfilment-modus voor de klant-checkout.
 *
 *  - `"manual"` (default): prijzen komen uit het lokale prijsmodel en een
 *    betaalde order blijft in de admin voor handmatige afhandeling. GEEN
 *    Probo-calls in de klantflow.
 *  - `"probo"`: het oorspronkelijke gedrag — live Probo-prijzen én een betaalde
 *    order wordt automatisch naar Probo gestuurd. Bedoeld voor een latere
 *    testomgeving.
 *
 * Lazy gelezen (functie i.p.v. const) zodat een runtime-override van
 * `FULFILMENT_MODE` — bijvoorbeeld in een test — daadwerkelijk doorwerkt.
 */
export type FulfilmentMode = "manual" | "probo";

export function fulfilmentMode(): FulfilmentMode {
  return process.env.FULFILMENT_MODE === "probo" ? "probo" : "manual";
}
