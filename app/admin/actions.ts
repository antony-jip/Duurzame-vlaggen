"use server";

/**
 * Auth server actions for the back-office: login and logout. Both run entirely
 * server-side; the cookie-bound Supabase server client writes/clears the session
 * cookies (allowed in Next server actions).
 */

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import { enkeleAdmin } from "./auth";

export interface LoginState {
  error?: string;
}

/**
 * Sign in with password (and e-mail, when there is more than one admin).
 *
 * Het e-mailadres is geen geheim maar een identifier: bij één admin vullen we 'm
 * server-side in, zodat inloggen neerkomt op één wachtwoord. De beveiliging zit
 * onveranderd in Supabase Auth + de ADMIN_EMAILS-allowlist: een geldig maar
 * niet-toegelaten account wordt alsnog uitgelogd en geweigerd.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  // Bij één admin negeren we een meegestuurd e-mailveld bewust: de bron van
  // waarheid is de allowlist, niet wat de client opstuurt.
  const email = enkeleAdmin()
    ? serverEnv.adminEmails[0]
    : String(formData.get("email") ?? "")
        .trim()
        .toLowerCase();

  if (!password) {
    return { error: "Vul je wachtwoord in." };
  }
  if (!email) {
    return {
      error:
        serverEnv.adminEmails.length === 0
          ? "Er is nog geen beheerder ingesteld (ADMIN_EMAILS is leeg)."
          : "Vul een e-mailadres in.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Inloggen mislukt. Controleer je wachtwoord." };
  }

  // Enforce the allowlist even on a successful password sign-in.
  if (!serverEnv.adminEmails.includes(email)) {
    await supabase.auth.signOut();
    return { error: "Dit account heeft geen toegang tot de back-office." };
  }

  redirect("/admin");
}

/** Sign out and return to the login page. */
export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
