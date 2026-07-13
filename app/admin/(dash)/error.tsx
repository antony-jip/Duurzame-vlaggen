"use client";

/**
 * Error boundary for the admin dashboard. Catches failures thrown by the
 * order-detail server actions (Probo/Mollie network errors, illegal state
 * transitions, an expired session hitting requireAdminUser) and renders a
 * recoverable message instead of the bare Next.js 500 screen.
 */

import { useEffect } from "react";
import { Button } from "@/components/ui";
import styles from "./admin.module.css";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] action failed:", error);
  }, [error]);

  const isAuth = error.message === "Niet geautoriseerd";

  return (
    <section className={styles.errorBox}>
      <h1 className={styles.pageTitle}>Er ging iets mis</h1>
      <p className={styles.muted}>
        {isAuth
          ? "Je sessie is verlopen of je hebt geen toegang. Log opnieuw in."
          : "De actie kon niet worden voltooid. Probeer het opnieuw; blijft het misgaan, controleer de order in Supabase."}
      </p>
      <p className={styles.errorDetail}>{error.message}</p>
      <div className={styles.actionRow}>
        {isAuth ? (
          <Button as="a" href="/admin/login" size="sm">
            Naar inloggen
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={() => reset()}>
            Opnieuw proberen
          </Button>
        )}
      </div>
    </section>
  );
}
