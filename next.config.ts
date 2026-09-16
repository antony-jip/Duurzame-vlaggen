import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. A stray package-lock.json in a
  // parent directory otherwise makes Turbopack infer the wrong root, which can
  // break file tracing on Vercel.
  turbopack: {
    root: projectRoot,
  },
  // De offerte-PDF leest het briefpapier van schijf (process.cwd()/public).
  // Expliciet meenemen, zodat de serverless-functie op Vercel het bestand heeft.
  outputFileTracingIncludes: {
    "/api/offerte": ["./public/briefpapier/**/*"],
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
    return [
      {
        // De huidige live flag-ciclo.nl stuurt al zijn bestel-CTA's naar
        // /bestel; die route bestaat hier niet. Zonder redirect breekt de
        // funnel vanaf het kennisdomein op dag één van de livegang.
        source: "/bestel",
        destination: "/collectie",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
