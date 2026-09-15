"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navy = "#16264F";
const navy2 = "#1E3364";
const gold = "#E8C874";
const cream = "#F2EFE8";
const muted = "#9FB0D1";

type Request = {
  id: string;
  type: string;
  summary: string;
  amount_xaf: number | null;
  status: string;
  contact_phone: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
};

export default function AdminDashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    uniqueVisitors: 0,
    pendingCount: 0,
    confirmedCount: 0,
    confirmedRevenue: 0,
  });
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed">("pending");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin?next=" + encodeURIComponent("/admin/dashboard"));
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      setIsAdmin(true);
      setChecking(false);
      load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const { data } = await supabase
      .from("purchase_requests")
      .select("*, profiles(full_name, phone)")
      .order("created_at", { ascending: false });
    setRequests((data as unknown as Request[]) || []);
    loadStats();
  }

  async function loadStats() {
    const [customersRes, visitorsRes, allRequestsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("visitor_events").select("session_id"),
      supabase.from("purchase_requests").select("status, amount_xaf"),
    ]);

    const uniqueSessions = new Set((visitorsRes.data || []).map((v) => v.session_id)).size;
    const allRequests = allRequestsRes.data || [];
    const pendingCount = allRequests.filter((r) => r.status === "pending").length;
    const confirmedRequests = allRequests.filter((r) => r.status === "confirmed");
    const confirmedRevenue = confirmedRequests.reduce((sum, r) => sum + (r.amount_xaf || 0), 0);

    setStats({
      totalCustomers: customersRes.count || 0,
      uniqueVisitors: uniqueSessions,
      pendingCount,
      confirmedCount: confirmedRequests.length,
      confirmedRevenue,
    });
  }

  async function markConfirmed(id: string) {
    await supabase
      .from("purchase_requests")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", id);
    load();
  }

  async function markCancelled(id: string) {
    await supabase.from("purchase_requests").update({ status: "cancelled" }).eq("id", id);
    load();
  }

  const STAGES = ["pending", "confirmed", "processing", "shipped", "delivered"];
  async function advanceStage(id: string, currentStatus: string) {
    const idx = STAGES.indexOf(currentStatus);
    const next = STAGES[idx + 1];
    if (!next) return;
    await supabase.from("purchase_requests").update({ status: next }).eq("id", id);
    load();
  }

  if (checking) {
    return (
      <main style={{ background: navy, color: cream, minHeight: "100vh" }} className="p-8">
        Checking access...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main style={{ background: navy, color: cream, minHeight: "100vh" }} className="p-8">
        <p>You don&apos;t have access to this page.</p>
      </main>
    );
  }

  const visible = requests.filter((r) => (filter === "all" ? true : r.status === filter));

  const typeLabel: Record<string, string> = {
    masterclass: "Masterclass",
    consultation: "Consultation",
    product_order: "Product order",
  };

  return (
    <main style={{ background: navy, color: cream, minHeight: "100vh" }} className="px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="Customers" value={stats.totalCustomers} />
          <StatCard label="Site visitors" value={stats.uniqueVisitors} />
          <StatCard label="Pending" value={stats.pendingCount} />
          <StatCard label="Confirmed" value={stats.confirmedCount} />
          <StatCard label="Revenue confirmed" value={`${stats.confirmedRevenue.toLocaleString()} XAF`} />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>
            Requests to confirm
          </h1>
          <a href="/admin/products" style={{ color: gold, fontSize: 14 }}>
            Manage products →
          </a>
        </div>

        <div className="mb-5 flex gap-2">
          {(["pending", "confirmed", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded px-3 py-1 text-sm capitalize"
              style={{
                background: filter === f ? gold : "transparent",
                color: filter === f ? navy : cream,
                border: "1px solid rgba(232,200,116,0.3)",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {visible.map((r) => (
            <div
              key={r.id}
              className="rounded p-4"
              style={{ background: navy2, border: "1px solid rgba(232,200,116,0.2)" }}
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <span
                    className="mr-2 rounded px-2 py-0.5 text-xs"
                    style={{ background: "rgba(232,200,116,0.15)", color: gold }}
                  >
                    {typeLabel[r.type] || r.type}
                  </span>
                  <span className="font-semibold">{r.summary}</span>
                </div>
                {r.amount_xaf && (
                  <span className="font-bold">{r.amount_xaf.toLocaleString()} XAF</span>
                )}
              </div>
              <div className="mb-3 text-sm" style={{ color: muted }}>
                {r.profiles?.full_name || "Unknown"} · {r.profiles?.phone || r.contact_phone || "—"} ·{" "}
                {new Date(r.created_at).toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="rounded px-2 py-0.5 text-xs capitalize"
                  style={{
                    color:
                      r.status === "confirmed" ? "#7CD98C" : r.status === "cancelled" ? "#E88686" : gold,
                  }}
                >
                  {r.status}
                </span>
                {r.status === "pending" && (
                  <>
                    <button
                      onClick={() => markConfirmed(r.id)}
                      className="ml-auto rounded px-3 py-1 text-sm font-semibold"
                      style={{ background: gold, color: navy }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => markCancelled(r.id)}
                      className="rounded px-3 py-1 text-sm"
                      style={{ border: "1px solid rgba(232,134,134,0.4)", color: "#E88686" }}
                    >
                      Cancel
                    </button>
                  </>
                )}
                {r.type === "product_order" &&
                  ["confirmed", "processing", "shipped"].includes(r.status) && (
                    <button
                      onClick={() => advanceStage(r.id, r.status)}
                      className="ml-auto rounded px-3 py-1 text-sm font-semibold"
                      style={{ background: gold, color: navy }}
                    >
                      Mark as {STAGES[STAGES.indexOf(r.status) + 1]}
                    </button>
                  )}
              </div>
            </div>
          ))}
          {!visible.length && <p style={{ color: muted }}>Nothing here yet.</p>}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded p-3"
      style={{ background: navy2, border: "1px solid rgba(232,200,116,0.2)" }}
    >
      <div className="text-xs" style={{ color: muted }}>
        {label}
      </div>
      <div className="text-lg font-bold" style={{ color: gold }}>
        {value}
      </div>
    </div>
  );
}
