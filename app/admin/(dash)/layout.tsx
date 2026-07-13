import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
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
      <header className={styles.header}>
        <Link href="/admin" className={styles.brand}>
          Duurzame Vlaggen <span className={styles.brandDivider}>·</span>{" "}
          <span className={styles.brandAdmin}>Admin</span>
        </Link>
        <div className={styles.headerRight}>
          <span className={styles.userEmail}>{user.email}</span>
          <form action={logout}>
            <Button type="submit" variant="tertiary" size="sm">
              Uitloggen
            </Button>
          </form>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
