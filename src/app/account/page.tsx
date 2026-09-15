import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

const navy = "#16264F";
const navy2 = "#1E3364";
const gold = "#E8C874";
const cream = "#F2EFE8";
const muted = "#9FB0D1";

const STAGES = ["pending", "confirmed", "processing", "shipped", "delivered"];

type PurchaseRequest = {
  id: string;
  type: string;
  summary: string;
  amount_xaf: number | null;
  status: string;
  created_at: string;
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, phone_verified")
    .eq("id", user.id)
    .single();

  const { data: requests } = await supabase
    .from("purchase_requests")
    .select("id, type, summary, amount_xaf, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const typeLabel: Record<string, string> = {
    masterclass: "Masterclass",
    consultation: "Consultation",
    product_order: "Product order",
  };

  return (
    <main style={{ background: navy, color: cream, minHeight: "100vh", width: "100%" }} className="px-6 py-12">
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>
            {profile?.full_name || "My account"}
          </h1>
          <p className="text-sm" style={{ color: muted }}>
            {user.email} · {profile?.phone}
            {!profile?.phone_verified && (
              <span
                className="ml-2 rounded px-2 py-0.5 text-xs"
                style={{ background: "rgba(232,200,116,0.15)", color: gold }}
              >
                Phone not verified
              </span>
            )}
          </p>
        </div>
        <form action={signOut}>
          <button
            className="rounded px-4 py-2 text-sm"
            style={{ border: "1px solid rgba(232,200,116,0.3)", color: cream }}
          >
            Sign out
          </button>
        </form>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold" style={{ color: gold }}>
          My orders & requests
        </h2>
        {!requests?.length && (
          <p className="text-sm" style={{ color: muted }}>Nothing yet -- browse the Masterclass, Products, or Importation catalog to get started.</p>
        )}
        <ul className="flex flex-col gap-3">
          {(requests as PurchaseRequest[] | null)?.map((r) => (
            <li
              key={r.id}
              className="rounded px-4 py-3"
              style={{ background: navy2, border: "1px solid rgba(232,200,116,0.2)" }}
            >
              <div className="mb-1 flex items-center justify-between">
                <div>
                  <span
                    className="mr-2 rounded px-2 py-0.5 text-xs"
                    style={{ background: "rgba(232,200,116,0.15)", color: gold }}
                  >
                    {typeLabel[r.type] || r.type}
                  </span>
                  <span className="font-medium">{r.summary}</span>
                </div>
                {r.amount_xaf && <span className="text-sm">{r.amount_xaf.toLocaleString()} XAF</span>}
              </div>

              {r.status === "cancelled" ? (
                <span className="text-sm" style={{ color: "#E88686" }}>Cancelled</span>
              ) : r.type === "product_order" ? (
                <OrderProgress status={r.status} />
              ) : (
                <span className="text-sm capitalize" style={{ color: r.status === "confirmed" ? "#7CD98C" : gold }}>
                  {r.status}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
    </main>
  );
}

function OrderProgress({ status }: { status: string }) {
  const currentIndex = STAGES.indexOf(status);
  const labels: Record<string, string> = {
    pending: "Placed",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
  };

  return (
    <div className="mt-2 flex items-center">
      {STAGES.map((stage, i) => (
        <div key={stage} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center" style={{ minWidth: 60 }}>
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: i <= currentIndex ? gold : "rgba(232,200,116,0.2)" }}
            />
            <span
              className="mt-1 text-center text-[10px]"
              style={{ color: i <= currentIndex ? gold : muted }}
            >
              {labels[stage]}
            </span>
          </div>
          {i < STAGES.length - 1 && (
            <div
              className="h-[1px] flex-1"
              style={{ background: i < currentIndex ? gold : "rgba(232,200,116,0.2)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
