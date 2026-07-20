import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * De afrekenpagina zelf is een client component en kan geen metadata
 * exporteren; deze laag zet de noindex. Robots.txt houdt crawlers al buiten,
 * maar een disallow voorkomt geen indexering van een elders gelinkte URL —
 * de expliciete noindex wel.
 */
export const metadata: Metadata = {
  title: "Afrekenen",
  robots: { index: false, follow: false },
};

export default function AfrekenenLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
