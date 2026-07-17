import Link from "next/link";
import type { Metadata } from "next";

/**
 * Merkgetrouwe 404. Vangt zowel onbekende URL's als `notFound()` uit
 * storefront-pagina's (bv. een niet-bestaande product-slug). Staat op root-
 * niveau zodat elke 404 wordt afgevangen; de pagina is zelfstandig gestyled
 * (root-layout rendert alleen <html>/<body>).
 */
export const metadata: Metadata = {
  title: "Pagina niet gevonden",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "96px 24px",
        gap: 8,
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
        Fout 404
      </p>
      <h1
        style={{
          fontFamily: "var(--font-heading, sans-serif)",
          fontSize: "clamp(30px, 6vw, 52px)",
          lineHeight: 1.05,
          margin: "8px 0 12px",
        }}
      >
        Deze pagina waait niet meer
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body, sans-serif)",
          color: "#54666a",
          maxWidth: 460,
          margin: "0 0 28px",
        }}
      >
        De pagina die je zoekt bestaat niet (meer). Bekijk de collectie of ga
        terug naar de homepage.
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/collectie"
          style={{
            fontFamily: "var(--font-ui, sans-serif)",
            fontWeight: 600,
            fontSize: 15,
            padding: "12px 22px",
            borderRadius: 10,
            background: "#2c5f4f",
            color: "#fff",
            textDecoration: "none",
          }}
        >
          Bekijk de collectie
        </Link>
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
    </main>
  );
}
