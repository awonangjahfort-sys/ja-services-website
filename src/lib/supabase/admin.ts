import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client. BYPASSES ROW LEVEL SECURITY -- only ever
// import this in server-only code that never runs in the browser:
// payment webhook handlers, admin dashboard API routes (after verifying the
// caller is an admin), and cron/background jobs.
//
// The `server-only` import above makes Next.js throw a build error if this
// file is ever accidentally imported from a Client Component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
