import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui";
import { getAdminUser } from "../auth";
import { logout } from "../actions";
import styles from "./admin.module.css";

/**
 * Auth-gate for every dashboard page. Runs on the server, re-validates the
 * Supabase session with getUser() and checks the ADMIN_EMAILS allowlist. Any
 * failure redirects to /admin/login (which lives outside this route group, so
 * there is no redirect loop).
 *
 * NOTE: this gate protects rendering; each mutating server action ALSO
 * re-verifies the session (see requireAdminUser) and never trusts the layout.
 */
export default async function DashLayout({ children }: { children: ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand} aria-label="Duurzame Vlaggen — Admin">
          {/* Light wordmark reads cleanly on the forest chrome. */}
          <Image
            src="/logo-full-light.png"
            alt="Duurzame Vlaggen"
            width={172}
            height={17}
            className={styles.brandLogo}
            priority
          />
        </Link>

        <nav className={styles.nav} aria-label="Beheer">
          <span className={styles.sideLabel}>Beheer</span>
          <Link href="/admin" className={`${styles.navLink} ${styles.navLinkActive}`}>
            <span className={styles.navIcon} aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 4v16" />
              </svg>
            </span>
            Orders
          </Link>
        </nav>

        <div className={styles.sideFoot}>
          <span className={styles.userEmail}>{user.email}</span>
          <form action={logout}>
            <Button type="submit" variant="secondary" size="sm" fullWidth>
              Uitloggen
            </Button>
          </form>
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
