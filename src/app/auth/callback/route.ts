import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase redirects here after a customer clicks the confirmation link in
// their email. Exchanges the one-time code for a real logged-in session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/account`);
}
