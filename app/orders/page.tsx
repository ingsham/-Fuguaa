"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/context";

type Order = {
  id: string;
  status: string;
  escrowStatus: string;
  totalGhs: string;
  createdAt: string;
  deliveredAt: string | null;
  shopName: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid — awaiting shop confirmation",
  confirmed: "Confirmed by seller",
  shipped: "Shipped",
  delivered: "Delivered",
  disputed: "Disputed",
  cancelled: "Cancelled",
};

function OrdersContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clear } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    // Paystack appends ?reference=...&trxref=... on redirect back here —
    // treat that as "checkout flow completed" and clear the local cart.
    if (searchParams.get("reference") || searchParams.get("trxref")) {
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders ?? []))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading") return null;

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted mb-4">Sign in to view your orders.</p>
        <button
          onClick={() => router.push("/login")}
          className="bg-terracotta text-white font-medium px-6 py-2.5 rounded-full"
        >
          Sign in
        </button>
      </div>
    );
  }

  async function confirmReceipt(orderId: string) {
    setActioning(orderId);
    const res = await fetch(`/api/orders/${orderId}/confirm-receipt`, {
      method: "POST",
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "delivered" } : o
        )
      );
    }
    setActioning(null);
  }

  async function reportIssue(orderId: string) {
    const reason = prompt(
      "Briefly describe the issue with this order (e.g. item not as described):"
    );
    if (!reason) return;
    setActioning(orderId);
    const res = await fetch(`/api/orders/${orderId}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "disputed" } : o))
      );
    }
    setActioning(null);
  }

  return (
    <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Your orders</h1>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted">No orders yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-charcoal/10 rounded-xl p-5"
            >
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <p className="font-medium">{order.shopName}</p>
                  <p className="text-sm text-muted">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-semibold">
                  GHS {Number(order.totalGhs).toFixed(2)}
                </p>
              </div>

              <p className="text-sm mt-3">
                Status:{" "}
                <span className="font-medium">
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </p>

              {order.status === "paid" || order.status === "shipped" ? (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => confirmReceipt(order.id)}
                    disabled={actioning === order.id}
                    className="text-sm bg-forest text-white px-4 py-2 rounded-full disabled:opacity-50"
                  >
                    I received this
                  </button>
                  <button
                    onClick={() => reportIssue(order.id)}
                    disabled={actioning === order.id}
                    className="text-sm border border-charcoal/20 px-4 py-2 rounded-full disabled:opacity-50"
                  >
                    Report an issue
                  </button>
                </div>
              ) : order.status === "delivered" ? (
                <button
                  onClick={() => reportIssue(order.id)}
                  disabled={actioning === order.id}
                  className="text-sm text-muted underline mt-3"
                >
                  Report an issue (within 72 hours of delivery)
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-10 text-muted">Loading...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
