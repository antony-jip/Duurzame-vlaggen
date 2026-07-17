"use client";

/**
 * Error boundary voor de storefront. Vangt render-fouten in publieke pagina's
 * (bv. een DB-hapering op /order of /account) en toont een herstelbaar,
 * merkgetrouw scherm binnen de Header/Footer i.p.v. de kale Next.js 500.
 */

import { useEffect } from "react";
import Link from "next/link";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[storefront] render error:", error);
  }, [error]);

  return (
    <section
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "96px 24px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-eyebrow, sans-serif)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontSize: 13,
          fontWeight: 700,
          color: "#2c5f4f",
          margin: 0,
        }}
      >
        Er ging iets mis
      </p>
      <h1
        style={{
          fontFamily: "var(--font-heading, sans-serif)",
          fontSize: "clamp(28px, 5vw, 44px)",
          lineHeight: 1.1,
          margin: "12px 0 16px",
        }}
      >
        Deze pagina laadde niet
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body, sans-serif)",
          color: "#54666a",
          margin: "0 0 28px",
        }}
      >
        Probeer het opnieuw. Blijft het misgaan, neem dan even contact op — we
        helpen je snel verder.
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => reset()}
          style={{
            fontFamily: "var(--font-ui, sans-serif)",
            fontWeight: 600,
            fontSize: 15,
            padding: "12px 22px",
            borderRadius: 10,
            border: "none",
            background: "#2c5f4f",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Opnieuw proberen
        </button>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-ui, sans-serif)",
            fontWeight: 600,
            fontSize: 15,
            padding: "12px 22px",
            borderRadius: 10,
            border: "1px solid #d6ddd6",
            color: "#212421",
            textDecoration: "none",
          }}
        >
          Naar de homepage
        </Link>
      </div>
    </section>
  );
}
