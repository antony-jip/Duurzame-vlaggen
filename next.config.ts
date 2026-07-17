import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * WordPress → Next 301-map. The old WP site lives on the same domains, so
 * Search Console still knows its URLs; every old path with equity needs a 301
 * to its new counterpart or the ranking is lost at go-live. Derived from
 * `docs/CONTENT-MAP.md` (the REST inventory) — the same source as the
 * `VOORSTEL` map in `lib/analytics/migratie.ts`, which surfaces uncovered old
 * URLs against live GSC data. The `null`-decision paths (/samples,
 * /bereken-besparing) are intentionally left out pending a build/301 decision.
 */
const WP_REDIRECTS: Array<{ source: string; destination: string }> = [
  { source: "/bestel-baniervlaggen", destination: "/collectie/baniervlag" },
  { source: "/bestel-mastvlaggen", destination: "/collectie/mastvlag" },
  { source: "/bestel-beachvlaggen", destination: "/collectie/beachvlag" },
  { source: "/bestel-gevelvlaggen", destination: "/collectie/gevelvlag" },
  { source: "/bestel-vlaggenmast", destination: "/collectie/vlaggenmast" },
  { source: "/bestel", destination: "/collectie" },
  { source: "/configurator", destination: "/collectie" },
  { source: "/confi-vlaggen", destination: "/collectie" },
  { source: "/producten", destination: "/collectie" },
  { source: "/shop", destination: "/collectie" },
  { source: "/offerte-aanvragen", destination: "/contact" },
  { source: "/about", destination: "/over-ons" },
  { source: "/blog", destination: "/kennisbank" },
  // Known WP slug typo ("comlpiance") — 301 to the corrected article.
  { source: "/kennisbank/csrd-comlpiance", destination: "/kennisbank/csrd-compliance" },
  { source: "/csrd-microplastics-probleem", destination: "/kennisbank/microplastics" },
  { source: "/cart", destination: "/winkelwagen" },
  { source: "/checkout", destination: "/afrekenen" },
  { source: "/my-account", destination: "/account" },
  { source: "/bestellingen", destination: "/account" },
];

/**
 * Baseline security headers (go-live hardening). A payment site needs at least
 * HSTS + clickjacking + MIME-sniffing protection. A full CSP is deliberately
 * left for a follow-up: Mollie hosts its own checkout off-site so the CSP only
 * needs our own origins + the Supabase image host, but it must be validated
 * against a real build before shipping to avoid breaking fonts/media.
 */
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. A stray package-lock.json in a
  // parent directory otherwise makes Turbopack infer the wrong root, which can
  // break file tracing on Vercel.
  turbopack: {
    root: projectRoot,
  },
  images: {
    // Product/sfeer photography lives in Supabase Storage (migrated from WP).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hyvtseexvsdpdlrzwtgi.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return WP_REDIRECTS.map((r) => ({ ...r, permanent: true }));
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
