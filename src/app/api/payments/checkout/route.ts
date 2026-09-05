import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments";

// POST /api/payments/checkout
// body: { referenceType: "enrollment" | "order", referenceId: string, payerPhone: string }
//
// Looks up the amount owed server-side (never trusts an amount from the
// client), creates a "pending" payments row, then asks the active provider
// to prompt the customer's phone for approval. The actual confirmation
// happens later via the provider's webhook (see /api/payments/webhook/*).
export async function POST(req: Request) {
  const body = await req.json();
  const { referenceType, referenceId, payerPhone } = body as {
    referenceType: "enrollment" | "order";
    referenceId: string;
    payerPhone: string;
  };

  if (!referenceType || !referenceId || !payerPhone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  // Resolve the authoritative amount + confirm the record belongs to this
  // user (RLS on the regular client enforces "own row or admin" already).
  let amountXaf: number;
  let description: string;

  if (referenceType === "enrollment") {
    const { data: enrollment, error } = await supabase
      .from("enrollments")
      .select("id, status, masterclass_tiers(name, price_xaf)")
      .eq("id", referenceId)
      .single();

    if (error || !enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }
    if (enrollment.status !== "pending") {
      return NextResponse.json({ error: "Enrollment is not payable" }, { status: 409 });
    }

    const tier = enrollment.masterclass_tiers as unknown as {
      name: string;
      price_xaf: number;
    };
    amountXaf = tier.price_xaf;
    description = `J.A Masterclass -- ${tier.name}`;
  } else {
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, status, total_xaf")
      .eq("id", referenceId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order is not payable" }, { status: 409 });
    }

    amountXaf = order.total_xaf;
    description = `J.A Products order ${order.id.slice(0, 8)}`;
  }

  const provider = getPaymentProvider();

  // Create the payment row BEFORE calling the provider so we have somewhere
  // to reconcile the webhook against even if the initiate() call fails
  // partway through.
  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .insert({
      provider: provider.name,
      provider_reference: `pending-${crypto.randomUUID()}`, // placeholder, updated below
      amount_xaf: amountXaf,
      reference_type: referenceType,
      reference_id: referenceId,
      payer_phone: payerPhone,
      status: "pending",
    })
    .select()
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: "Could not create payment record" }, { status: 500 });
  }

  try {
    const result = await provider.initiate({
      amountXaf,
      payerPhone,
      referenceType,
      referenceId,
      description,
    });

    await admin
      .from("payments")
      .update({ provider_reference: result.providerReference })
      .eq("id", payment.id);

    return NextResponse.json({
      paymentId: payment.id,
      status: result.status,
      message: "Check your phone to approve the payment.",
    });
  } catch (err) {
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    console.error("Payment initiation failed:", err);
    return NextResponse.json({ error: "Payment initiation failed" }, { status: 502 });
  }
}
