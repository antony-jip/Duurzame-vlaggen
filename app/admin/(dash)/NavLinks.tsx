"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./admin.module.css";

/**
 * Zijbalk-navigatie. Client-component puur om de actieve link te bepalen: de
 * layout is een server-component en kan het pad niet lezen. Stond eerder inline
 * met een hardcoded actieve staat op Orders, wat met een tweede link niet meer
 * klopt.
 */

interface Item {
  href: string;
  label: string;
  icon: ReactNode;
  /** Exacte match i.p.v. prefix — anders is `/admin` altijd actief. */
  exact?: boolean;
}

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ITEMS: Item[] = [
  {
    href: "/admin",
    label: "Orders",
    exact: true,
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 4v16" />
      </svg>
    ),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 3 3 5-6" />
      </svg>
    ),
  },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Beheer">
      <span className={styles.sideLabel}>Beheer</span>
      {ITEMS.map((item) => {
        const actief = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={actief ? "page" : undefined}
            className={`${styles.navLink} ${actief ? styles.navLinkActive : ""}`}
          >
            <span className={styles.navIcon} aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
