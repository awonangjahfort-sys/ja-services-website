import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/auth/status
// Lets the legacy site.js (plain script, no bundler) check auth state
// without needing the full Supabase JS SDK loaded client-side.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return NextResponse.json({ loggedIn: !!user });
}
