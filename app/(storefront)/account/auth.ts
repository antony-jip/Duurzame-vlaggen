import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CustomerIdentity } from "@/lib/orders/customer";

/**
 * Klant-auth voor het portaal — volledig LOSGEKOPPELD van de admin. Een
 * ingelogde klant is gewoon een Supabase-user; er is GEEN ADMIN_EMAILS-check.
 * De admin-gate (`app/admin/auth.ts`) blijft ongewijzigd.
 *
 * `getUser()` (niet `getSession()`) wordt bewust gebruikt: dat hervalideert het
 * token bij Supabase in plaats van een mogelijk vervalste cookie te vertrouwen.
 */

/** De ingelogde klant, of null als er geen (geldige) sessie is. */
export async function getCustomerUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ? user : null;
}

/**
 * Gate voor een portaal-pagina: hercheckt de sessie bij elke render en stuurt bij
 * afwezigheid door naar de login. Geeft de server-afgeleide identiteit terug
 * (auth-user-id + geverifieerd e-mailadres) om orders strikt op te scopen.
 */
export async function requireCustomer(): Promise<CustomerIdentity & { user: User }> {
  const user = await getCustomerUser();
  if (!user?.email) redirect("/account/inloggen");
  return { authUserId: user.id, email: user.email, user };
}
