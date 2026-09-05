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

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{profile?.full_name || "My account"}</h1>
          <p className="text-sm text-gray-500">
            {user.email} · {profile?.phone}
            {!profile?.phone_verified && (
              <span className="ml-2 rounded bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700">
                Phone not verified
              </span>
            )}
          </p>
        </div>
        <form action={signOut}>
          <button className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
            Sign out
          </button>
        </form>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Masterclass enrollments</h2>
        {!enrollments?.length && (
          <p className="text-sm text-gray-500">No enrollments yet.</p>
        )}
        <ul className="flex flex-col gap-2">
          {enrollments?.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded border border-gray-200 px-4 py-3"
            >
              <span>{(e.masterclass_tiers as unknown as { name: string })?.name}</span>
              <span className="text-sm capitalize text-gray-500">{e.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Orders</h2>
        {!orders?.length && <p className="text-sm text-gray-500">No orders yet.</p>}
        <ul className="flex flex-col gap-2">
          {orders?.map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between rounded border border-gray-200 px-4 py-3"
            >
              <span>Order #{o.id.slice(0, 8)}</span>
              <span className="text-sm">{o.total_xaf.toLocaleString()} XAF</span>
              <span className="text-sm capitalize text-gray-500">{o.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
