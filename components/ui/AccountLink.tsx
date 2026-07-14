"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "./Icon";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./Header.module.css";

/**
 * Header-link naar het klantportaal met de juiste staat: ingelogd → "Mijn
 * account", anders → "Inloggen". De inlog-staat komt client-side uit de
 * browser-Supabase-client en volgt live auth-wijzigingen. Tot de check klaar is
 * (of als auth niet beschikbaar is, bijv. lokaal) tonen we "Inloggen".
 */
export function AccountLink() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    try {
      const supabase = createSupabaseBrowserClient();
      supabase.auth
        .getUser()
        .then(({ data }) => {
          if (active) setLoggedIn(Boolean(data.user));
        })
        .catch(() => {
          /* geen sessie / auth onbereikbaar → uitgelogd tonen */
        });
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (active) setLoggedIn(Boolean(session?.user));
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      /* dummy-env lokaal → laat de knop gewoon op "Inloggen" staan */
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const label = loggedIn ? "Mijn account" : "Inloggen";
  const href = loggedIn ? "/account" : "/account/inloggen";

  return (
    <Link href={href} className={styles.account} aria-label={label}>
      <User size={20} />
      <span className={styles.accountWord}>{label}</span>
    </Link>
  );
}
