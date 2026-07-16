"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./admin.module.css";

/**
 * Twee-staps-verwijderknop voor de orderlijst: eerste klik wapent ("Zeker?"),
 * tweede klik verstuurt de server action. Geen native confirm-dialoog (die
 * blokkeert de hele tab) en geen ongelukken door één misklik; na 4 seconden
 * ontwapent hij zichzelf weer.
 */
export function VerwijderOrder({
  orderId,
  orderNumber,
  action,
}: {
  orderId: string;
  orderNumber: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function arm() {
    setArmed(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setArmed(false), 4000);
  }

  if (!armed) {
    return (
      <button
        type="button"
        className={styles.verwijderKnop}
        onClick={arm}
        aria-label={`Order ${orderNumber} verwijderen`}
        title="Order verwijderen"
      >
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    );
  }

  return (
    <form action={action} className={styles.verwijderBevestig}>
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        className={styles.verwijderZeker}
        aria-label={`Bevestig: order ${orderNumber} definitief verwijderen`}
      >
        Zeker?
      </button>
    </form>
  );
}
