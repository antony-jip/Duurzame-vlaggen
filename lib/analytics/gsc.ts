import "server-only";
import crypto from "node:crypto";
import { serverEnv } from "@/lib/env";

/**
 * Google Search Console — service-account auth + Search Analytics queries.
 *
 * Bewust handgerold met alleen `node:crypto`: een service-account-JWT is ~40
 * regels, terwijl `google-auth-library`/`googleapis` een forse dependency
 * toevoegt voor één endpoint. Dezelfde aanpak draait al op signcompany.
 *
 * Auth-flow: JWT (RS256) zelf ondertekenen → inwisselen bij Google's
 * token-endpoint voor een access-token → Bearer op de API-call.
 *
 * Alles hier is read-only (scope `webmasters.readonly`).
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const API_BASE = "https://www.googleapis.com/webmasters/v3/sites";

/** Google levert data 2-3 dagen vertraagd; verser opvragen geeft lege dagen. */
export const GSC_LAG_DAGEN = 3;

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Module-level token-cache. Overleeft alleen binnen één warme lambda; dat is
 * genoeg om de ~10 queries van één dashboard-render op één token te doen.
 */
let tokenCache: { token: string; verlooptOp: number } | null = null;

async function accessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.verlooptOp - 60_000) {
    return tokenCache.token;
  }

  const email = serverEnv.gscClientEmail;
  const key = serverEnv.gscPrivateKey;
  if (!email || !key) {
    throw new Error(
      "GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY niet ingesteld. Zie docs/ANALYTICS-PLAN.md.",
    );
  }

  const nu = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: nu,
      exp: nu + 3600,
    }),
  );

  const handtekening = crypto
    .createSign("RSA-SHA256")
    .update(`${header}.${claim}`)
    .sign(key);

  const jwt = `${header}.${claim}.${b64url(handtekening)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const tekst = await res.text().catch(() => "");
    throw new Error(
      `GSC-token mislukt (${res.status}). Controleer of het service-account bestaat en de sleutel klopt. ${tekst.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    verlooptOp: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

export type GscDimensie = "query" | "page" | "date" | "device" | "country";

export interface GscRij {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GscQueryOpties {
  startDate: string;
  endDate: string;
  dimensions?: GscDimensie[];
  rowLimit?: number;
  startRow?: number;
}

/**
 * Eén Search Analytics-query. Gooit bij een niet-ok respons; de aanroeper
 * wikkelt dat in `veilig()` zodat één kapotte bron niet de hele pagina sloopt.
 */
export async function gscQuery(opties: GscQueryOpties): Promise<GscRij[]> {
  const site = serverEnv.gscSiteUrl;
  if (!site) {
    throw new Error(
      "GSC_SITE_URL niet ingesteld (bijv. `sc-domain:duurzame-vlaggen.nl`).",
    );
  }

  const token = await accessToken();
  const url = `${API_BASE}/${encodeURIComponent(site)}/searchAnalytics/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      startDate: opties.startDate,
      endDate: opties.endDate,
      dimensions: opties.dimensions ?? [],
      rowLimit: opties.rowLimit ?? 1000,
      startRow: opties.startRow ?? 0,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const tekst = await res.text().catch(() => "");
    if (res.status === 403) {
      throw new Error(
        `Geen toegang tot property "${site}" (403). Voeg ${serverEnv.gscClientEmail ?? "het service-account"} toe als gebruiker in Search Console.`,
      );
    }
    throw new Error(`GSC-query mislukt (${res.status}). ${tekst.slice(0, 200)}`);
  }

  const data = (await res.json()) as { rows?: GscRij[] };
  return data.rows ?? [];
}

/**
 * Per-sectie error-isolatie. Een ontbrekende env-var of een 403 breekt zo
 * alleen zijn eigen kaart in plaats van de hele pagina.
 */
export async function veilig<T>(
  fn: () => Promise<T>,
): Promise<{ data: T; fout: null } | { data: null; fout: string }> {
  try {
    return { data: await fn(), fout: null };
  } catch (e) {
    return { data: null, fout: e instanceof Error ? e.message : String(e) };
  }
}

/** Is de GSC-koppeling überhaupt geconfigureerd? Bepaalt de setup-melding. */
export function gscGeconfigureerd(): boolean {
  return Boolean(
    serverEnv.gscClientEmail && serverEnv.gscPrivateKey && serverEnv.gscSiteUrl,
  );
}
