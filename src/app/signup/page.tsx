import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

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

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, status, masterclass_tiers(name)")
    .eq("user_id", user.id);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_xaf, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const navy = "#16264F";
  const navy2 = "#1E3364";
  const gold = "#E8C874";
  const cream = "#F2EFE8";
  const muted = "#9FB0D1";

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

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold" style={{ color: gold }}>
          Masterclass enrollments
        </h2>
        {!enrollments?.length && <p className="text-sm" style={{ color: muted }}>No enrollments yet.</p>}
        <ul className="flex flex-col gap-2">
          {enrollments?.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded px-4 py-3"
              style={{ background: navy2, border: "1px solid rgba(232,200,116,0.2)" }}
            >
              <span>{(e.masterclass_tiers as unknown as { name: string })?.name}</span>
              <span className="text-sm capitalize" style={{ color: muted }}>{e.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold" style={{ color: gold }}>
          Orders
        </h2>
        {!orders?.length && <p className="text-sm" style={{ color: muted }}>No orders yet.</p>}
        <ul className="flex flex-col gap-2">
          {orders?.map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between rounded px-4 py-3"
              style={{ background: navy2, border: "1px solid rgba(232,200,116,0.2)" }}
            >
              <span>Order #{o.id.slice(0, 8)}</span>
              <span className="text-sm">{o.total_xaf.toLocaleString()} XAF</span>
              <span className="text-sm capitalize" style={{ color: muted }}>{o.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
    </main>
  );
}
