"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type PendingSeller = {
  id: string;
  shopName: string;
  region: string | null;
  ghanaCardDocUrl: string | null;
  createdAt: string;
};

type Dispute = {
  id: string;
  orderId: string;
  reason: string;
  status: string;
  shopName: string;
  totalGhs: string;
};

type Metrics = { verifiedSellers: number; totalOrders: number; gmvGhs: number };

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [sellers, setSellers] = useState<PendingSeller[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    if (session?.user?.role !== "admin") return;
    fetch("/api/admin/sellers")
      .then((r) => r.json())
      .then((d) => setSellers(d.sellers ?? []));
    fetch("/api/admin/disputes")
      .then((r) => r.json())
      .then((d) => setDisputes(d.disputes ?? []));
    fetch("/api/admin/metrics")
      .then((r) => r.json())
      .then(setMetrics);
  }, [session]);

  if (status === "loading") return null;

  if (session?.user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted mb-4">Admin access only.</p>
        <button
          onClick={() => router.push("/")}
          className="bg-terracotta text-white font-medium px-6 py-2.5 rounded-full"
        >
          Go home
        </button>
      </div>
    );
  }

  async function verifySeller(id: string, decision: "approved" | "rejected") {
    const res = await fetch(`/api/admin/sellers/${id}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    if (res.ok) {
      setSellers((prev) => prev.filter((s) => s.id !== id));
    }
  }

  async function resolveDispute(
    id: string,
    resolution: "resolved" | "rejected",
    refundBuyer: boolean
  ) {
    const res = await fetch(`/api/admin/disputes/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: resolution, refundBuyer }),
    });
    if (res.ok) {
      setDisputes((prev) => prev.filter((d) => d.id !== id));
    }
  }

  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Admin</h1>

      {metrics && (
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="border border-charcoal/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold">{metrics.verifiedSellers}</p>
            <p className="text-xs text-muted">Verified sellers</p>
          </div>
          <div className="border border-charcoal/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold">{metrics.totalOrders}</p>
            <p className="text-xs text-muted">Total orders</p>
          </div>
          <div className="border border-charcoal/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold">
              GHS {metrics.gmvGhs.toFixed(0)}
            </p>
            <p className="text-xs text-muted">Gross volume</p>
          </div>
        </div>
      )}

      <h2 className="font-semibold mb-3">Seller verification queue</h2>
      {sellers.length === 0 ? (
        <p className="text-sm text-muted mb-10">Nothing pending.</p>
      ) : (
        <ul className="flex flex-col gap-3 mb-10">
          {sellers.map((s) => (
            <li
              key={s.id}
              className="border border-charcoal/10 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
            >
              <div>
                <p className="font-medium">{s.shopName}</p>
                <p className="text-sm text-muted">{s.region}</p>
                {s.ghanaCardDocUrl && (
                  <a
                    href={s.ghanaCardDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-terracotta underline"
                  >
                    View ID document
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => verifySeller(s.id, "approved")}
                  className="text-sm bg-forest text-white px-4 py-2 rounded-full"
                >
                  Approve
                </button>
                <button
                  onClick={() => verifySeller(s.id, "rejected")}
                  className="text-sm border border-charcoal/20 px-4 py-2 rounded-full"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="font-semibold mb-3">Open disputes</h2>
      {disputes.length === 0 ? (
        <p className="text-sm text-muted">No open disputes.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {disputes.map((d) => (
            <li key={d.id} className="border border-charcoal/10 rounded-xl p-4">
              <p className="font-medium">
                {d.shopName} · GHS {Number(d.totalGhs).toFixed(2)}
              </p>
              <p className="text-sm text-muted mt-1">{d.reason}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => resolveDispute(d.id, "resolved", true)}
                  className="text-sm bg-terracotta text-white px-4 py-2 rounded-full"
                >
                  Refund buyer
                </button>
                <button
                  onClick={() => resolveDispute(d.id, "rejected", false)}
                  className="text-sm border border-charcoal/20 px-4 py-2 rounded-full"
                >
                  Release to seller
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
