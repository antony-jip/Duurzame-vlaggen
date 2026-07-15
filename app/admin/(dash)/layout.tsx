import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui";
import { getAdminUser } from "../auth";
import { logout } from "../actions";
import { NavLinks } from "./NavLinks";
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

        <NavLinks />

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
