"use server";

/**
 * Auth-serveracties voor het klantportaal: inloggen, registreren, uitloggen.
 * Alles draait server-side; de cookie-gebonden Supabase-serverclient schrijft/
 * wist de sessiecookies (toegestaan in Next server actions).
 *
 * Bewust GEEN admin-allowlist: iedere geldige Supabase-user is een klant. De
 * back-office-login (`app/admin/actions.ts`) staat hier los van.
 */

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AccountAuthState {
  error?: string;
  /** Infomelding (bijv. "bevestig je e-mail") bij registratie zonder sessie. */
  notice?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Inloggen met e-mail + wachtwoord. Bij succes door naar het dashboard. */
export async function login(
  _prev: AccountAuthState,
  formData: FormData,
): Promise<AccountAuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vul je e-mailadres en wachtwoord in." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Inloggen mislukt. Controleer je e-mailadres en wachtwoord." };
  }

  redirect("/account");
}

/**
 * Registreren met e-mail + wachtwoord. Als de Supabase-instelling e-mailbevestiging
 * vereist, is er nog geen sessie: dan tonen we een bevestigingsmelding. Anders
 * (auto-confirm) gaat de klant meteen door naar het dashboard.
 */
export async function register(
  _prev: AccountAuthState,
  formData: FormData,
): Promise<AccountAuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Vul een geldig e-mailadres in." };
  }
  if (password.length < 8) {
    return { error: "Kies een wachtwoord van minimaal 8 tekens." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { error: "Registreren mislukt. Mogelijk bestaat er al een account met dit e-mailadres." };
  }

  // Sessie aanwezig → direct ingelogd. Anders wacht er een bevestigingsmail.
  if (data.session) {
    redirect("/account");
  }
  return {
    notice:
      "Bijna klaar! We hebben je een e-mail gestuurd om je account te bevestigen. Daarna kun je inloggen.",
  };
}

/** Uitloggen en terug naar de login. */
export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/account/inloggen");
}
