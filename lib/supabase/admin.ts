import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";
import type { Database } from "@/lib/db/types";

/**
 * Privileged Supabase client using the service-role key. Bypasses RLS.
 *
 * SERVER-ONLY. The `server-only` import makes the build fail if this module is
 * ever pulled into a client bundle. Use this for all order/customer writes
 * driven by webhooks and server actions (build spec §6: "writes happen via the
 * service-role key server-side").
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(publicEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
