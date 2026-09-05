import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/enrollments/[id]/whatsapp-link
// Returns the private WhatsApp group link ONLY if this enrollment belongs to
// the requesting user (or they're an admin) AND payment has been confirmed.
// The link itself lives in masterclass_tier_secrets, which has no public RLS
// policy -- it can only be read here, with the service-role client, after
// this check passes.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // RLS (enrollments_select_own_or_admin) ensures this only returns a row if
  // it belongs to `user` or `user` is an admin.
  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .select("id, tier_id, status, whatsapp_link_revealed")
    .eq("id", id)
    .single();

  if (error || !enrollment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!enrollment.whatsapp_link_revealed || enrollment.status !== "confirmed") {
    return NextResponse.json(
      { error: "Payment not yet confirmed", status: enrollment.status },
      { status: 402 }
    );
  }

  const admin = createAdminClient();
  const { data: secret } = await admin
    .from("masterclass_tier_secrets")
    .select("whatsapp_group_link")
    .eq("tier_id", enrollment.tier_id)
    .single();

  if (!secret) {
    return NextResponse.json({ error: "No group link configured for this tier" }, { status: 500 });
  }

  return NextResponse.json({ whatsappGroupLink: secret.whatsapp_group_link });
}
