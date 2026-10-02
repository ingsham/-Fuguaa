"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/lib/cart/context";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const { items, total } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") return null;

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted mb-4">Please sign in to check out.</p>
        <button
          onClick={() => router.push("/login")}
          className="bg-terracotta text-white font-medium px-6 py-2.5 rounded-full"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-muted">
        Your cart is empty.
      </div>
    );
  }

  async function handlePay() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not start checkout.");
        setLoading(false);
        return;
      }

      // Redirect to Paystack's hosted checkout page. Cart is cleared once
      // payment succeeds (see /orders, reached via the Paystack callback URL).
      window.location.href = data.authorizationUrl;
    } catch {
      setError("Could not reach the payment provider. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg w-full px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

      <div className="border border-charcoal/10 rounded-xl p-5 mb-6">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.size}-${item.color}`}
            className="flex justify-between text-sm py-1.5"
          >
            <span>
              {item.title} × {item.quantity}
            </span>
            <span>GHS {(item.priceGhs * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold pt-3 mt-2 border-t border-charcoal/10">
          <span>Total</span>
          <span>GHS {total.toFixed(2)}</span>
        </div>
      </div>

      <p className="text-sm text-muted mb-6">
        You&apos;ll be redirected to Paystack to pay by Mobile Money or card.
        Your payment is held until you confirm the order arrived.
      </p>

      {error && <p className="text-sm text-terracotta mb-4">{error}</p>}

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-terracotta text-white font-medium py-3 rounded-full hover:bg-charcoal transition-colors disabled:opacity-50"
      >
        {loading ? "Starting payment..." : `Pay GHS ${total.toFixed(2)}`}
      </button>
    </div>
  );
}
