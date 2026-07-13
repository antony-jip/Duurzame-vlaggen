import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMarketConfig, getRedirectTarget } from "@/config/domains";

/**
 * Proxy (Next.js 16's renamed middleware — must be named `proxy.ts`, at the
 * project root). Runs on the Node.js runtime before routes render.
 *
 * Two behaviours, keyed on the request hostname (build spec §3):
 *   1. Redirect domains → 301 to their target on a market domain.
 *   2. Market domains   → forward the request with market/locale/currency
 *                         headers so server code knows which shop it is serving.
 *
 * No secrets and no data access here — this only reads the hostname.
 */
export function proxy(request: NextRequest): NextResponse {
  const hostname = request.headers.get("host") ?? request.nextUrl.hostname;

  // 1. Redirect domains: 301 to the market domain, no content of their own.
  const redirect = getRedirectTarget(hostname);
  if (redirect) {
    const target = new URL(redirect.toPath, `https://${redirect.toHost}`);
    return NextResponse.redirect(target, 301);
  }

  // 2. Market domains: pass market context downstream via request headers.
  const market = getMarketConfig(hostname);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-market", market.market);
  requestHeaders.set("x-ui-catalog", market.uiCatalog);
  requestHeaders.set("x-hreflang", market.hreflang);
  requestHeaders.set("x-currency", market.currency);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Run on everything except API routes, Next internals, and static metadata.
  // API routes resolve their own market from the order payload, not the host.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
