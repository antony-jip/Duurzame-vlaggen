"use client";

import { useActionState } from "react";
import { Button, Field } from "@/components/ui";
import { login, type LoginState } from "../actions";
import styles from "./login.module.css";

const initialState: LoginState = {};

/**
 * @param vraagEmail  Bij één beheerder (ADMIN_EMAILS) leidt de server het adres
 *                    zelf af en volstaat een wachtwoord; bij meerdere moet je
 *                    zeggen wie je bent.
 */
export function LoginForm({ vraagEmail }: { vraagEmail: boolean }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className={styles.form}>
      {vraagEmail && (
        <Field
          id="email"
          name="email"
          type="email"
          label="E-mailadres"
          autoComplete="username"
          required
          placeholder="jij@signcompany.nl"
        />
      )}
      <Field
        id="password"
        name="password"
        type="password"
        label="Wachtwoord"
        autoComplete="current-password"
        required
      />
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" fullWidth loading={pending}>
        Inloggen
      </Button>
    </form>
  );
}
