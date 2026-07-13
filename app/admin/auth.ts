import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";

/**
 * Admin auth helpers for the back-office. Access requires BOTH a valid Supabase
 * Auth session AND the signed-in e-mail being on the ADMIN_EMAILS allowlist.
 *
 * `getUser()` (not `getSession()`) is used deliberately: it re-validates the
 * token with Supabase rather than trusting a possibly-forged cookie.
 */

/** Returns the signed-in admin user, or null when not authenticated/allowlisted. */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;
  const allowed = serverEnv.adminEmails.includes(user.email.toLowerCase());
  return allowed ? user : null;
}

/**
 * Re-verify the admin session inside a server action before it mutates data or
 * calls Probo/Mollie. Never trust the layout gate alone. Throws on failure.
 */
export async function requireAdminUser(): Promise<User> {
  const user = await getAdminUser();
  if (!user) throw new Error("Niet geautoriseerd");
  return user;
}

/**
 * Gate an admin *page* (not just the layout): re-checks the session on every
 * render and redirects to the login when absent/not-allowlisted. Layouts don't
 * re-render on client-side navigation, so each protected page must call this
 * itself — otherwise a segment request could render order data ungated.
 */
export async function requireAdminPage(): Promise<User> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
