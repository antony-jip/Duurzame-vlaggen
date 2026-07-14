"use client";

import { useActionState, useState } from "react";
import { Button, Field } from "@/components/ui";
import { login, register, type AccountAuthState } from "../actions";
import styles from "../account.module.css";

type Mode = "login" | "register";

const initialAccountAuthState: AccountAuthState = {};

/**
 * Login + registratie in één paneel met tabs. Twee losse `useActionState`-hooks
 * (login/register) zodat elk formulier zijn eigen fout-/pending-status houdt.
 */
export function AccountAuthForm() {
  const [mode, setMode] = useState<Mode>("login");

  const [loginState, loginAction, loginPending] = useActionState<
    AccountAuthState,
    FormData
  >(login, initialAccountAuthState);
  const [regState, regAction, regPending] = useActionState<
    AccountAuthState,
    FormData
  >(register, initialAccountAuthState);

  const state = mode === "login" ? loginState : regState;

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Inloggen of registreren">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={`${styles.tab} ${mode === "login" ? styles.tabActive : ""}`}
          onClick={() => setMode("login")}
        >
          Inloggen
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          className={`${styles.tab} ${mode === "register" ? styles.tabActive : ""}`}
          onClick={() => setMode("register")}
        >
          Account aanmaken
        </button>
      </div>

      {mode === "login" ? (
        <form action={loginAction} className={styles.form}>
          <Field
            id="login-email"
            name="email"
            type="email"
            label="E-mailadres"
            autoComplete="username"
            required
            placeholder="jij@voorbeeld.nl"
          />
          <Field
            id="login-password"
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
          <Button type="submit" fullWidth loading={loginPending}>
            Inloggen
          </Button>
        </form>
      ) : (
        <form action={regAction} className={styles.form}>
          <Field
            id="reg-email"
            name="email"
            type="email"
            label="E-mailadres"
            autoComplete="username"
            required
            placeholder="jij@voorbeeld.nl"
          />
          <Field
            id="reg-password"
            name="password"
            type="password"
            label="Wachtwoord"
            autoComplete="new-password"
            required
            helperText="Minimaal 8 tekens."
          />
          {state.error && (
            <p className={styles.error} role="alert">
              {state.error}
            </p>
          )}
          {state.notice && (
            <p className={styles.notice} role="status">
              {state.notice}
            </p>
          )}
          <Button type="submit" fullWidth loading={regPending}>
            Account aanmaken
          </Button>
        </form>
      )}
    </>
  );
}
