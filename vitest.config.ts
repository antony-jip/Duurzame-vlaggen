import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // `@/*` → project root, mirroring tsconfig paths.
      "@": r("./"),
      // `server-only`/`client-only` throw outside the Next bundler — stub them.
      "server-only": r("./test/stubs/empty.ts"),
      "client-only": r("./test/stubs/empty.ts"),
    },
  },
  test: {
    environment: "node",
    // Load .env.local so e2e tests can reach the live TEST APIs.
    setupFiles: ["./test/setup.ts"],
    // Unit runs exclude e2e; `npm run test:e2e` targets them explicitly.
  },
});
