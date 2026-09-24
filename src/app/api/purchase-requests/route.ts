import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/purchase-requests
// Called right before a signed-in customer is sent to WhatsApp to pay/book --
// saves a record so it shows up on the admin dashboard. Uses the customer's
// own session (not the admin client), so RLS enforces they can only create
// requests under their own account.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json();
  const { type, summary, amountXaf, contactPhone } = body as {
    type: "masterclass" | "consultation" | "product_order";
    summary: string;
    amountXaf?: number;
    contactPhone?: string;
  };

  if (!type || !summary) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("purchase_requests")
    .insert({
      user_id: user.id,
      type,
      summary,
      amount_xaf: amountXaf ?? null,
      contact_phone: contactPhone ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: data });
}
