import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/products
// Public, read-only. Returns active products, newest first -- used by the
// "New Arrivals" section on the homepage (products added via /admin/products).
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name, description, price_xaf, stock, category, images, video_url")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data });
}
