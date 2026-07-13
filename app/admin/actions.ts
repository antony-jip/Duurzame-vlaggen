"use server";

/**
 * Auth server actions for the back-office: login and logout. Both run entirely
 * server-side; the cookie-bound Supabase server client writes/clears the session
 * cookies (allowed in Next server actions).
 */

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";

export interface LoginState {
  error?: string;
}

/**
 * Sign in with e-mail + password. On success the account must also be on the
 * ADMIN_EMAILS allowlist, otherwise it is signed out again and rejected — so a
 * valid-but-unlisted Supabase user can never reach the dashboard.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vul een e-mailadres en wachtwoord in." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Inloggen mislukt. Controleer je gegevens." };
  }

  // Enforce the allowlist even on a successful password sign-in.
  if (!serverEnv.adminEmails.includes(email.toLowerCase())) {
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
