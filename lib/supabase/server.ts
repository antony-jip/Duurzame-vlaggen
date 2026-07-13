import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";

/**
 * Cookie-bound Supabase client for Server Components, Route Handlers and Server
 * Actions. Uses the anon key and the user's session cookies, so it respects RLS
 * — use it for reads on behalf of a logged-in customer (optional Supabase Auth).
 *
 * For privileged writes (webhooks, order mutations) use the admin client instead.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // `setAll` was called from a Server Component, where cookies are
          // read-only. Safe to ignore when a proxy/route refreshes the session.
        }
      },
    },
  });
}
