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
};

export default nextConfig;
