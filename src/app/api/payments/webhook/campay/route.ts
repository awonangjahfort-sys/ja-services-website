import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { campayProvider } from "@/lib/payments/campay";

// POST /api/payments/webhook/campay
// Configure this URL in your Campay dashboard as the payment webhook.
// This is the ONLY place enrollment/order status flips to "paid" -- the
// client can never set that itself (see the RLS policies in schema.sql).
export async function POST(req: Request) {
  const rawBody = await req.text();

  let result;
  try {
    result = await campayProvider.verifyWebhook(req, rawBody);
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("provider", "campay")
    .eq("provider_reference", result.providerReference)
    .single();

  if (!payment) {
    // Unknown reference -- log and 200 anyway so the provider doesn't retry forever.
    console.error("Webhook for unknown payment reference:", result.providerReference);
    return NextResponse.json({ ok: true });
  }

  if (payment.status === "success") {
    // Already processed (webhooks can be retried/duplicated) -- no-op.
    return NextResponse.json({ ok: true });
  }

  await admin
    .from("payments")
    .update({
      status: result.status,
      raw_webhook_payload: result.rawPayload as object,
      confirmed_at: result.status === "success" ? new Date().toISOString() : null,
    })
    .eq("id", payment.id);

  if (result.status !== "success") {
    return NextResponse.json({ ok: true });
  }

  // Payment confirmed -- flip the enrollment/order and (for enrollments)
  // mark the WhatsApp link as revealable. The link itself is fetched by the
  // client afterwards via /api/enrollments/[id]/whatsapp-link, which
  // re-checks this status server-side before returning it.
  if (payment.reference_type === "enrollment") {
    await admin
      .from("enrollments")
      .update({ status: "confirmed", payment_id: payment.id, whatsapp_link_revealed: true })
      .eq("id", payment.reference_id);
  } else {
    await admin
      .from("orders")
      .update({ status: "paid", payment_id: payment.id })
      .eq("id", payment.reference_id);
  }

  return NextResponse.json({ ok: true });
}
