"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart/context";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl w-full px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Your cart is empty</h1>
        <p className="text-muted mb-6">Find something handwoven to love.</p>
        <Link
          href="/shop"
          className="bg-terracotta text-white font-medium px-6 py-2.5 rounded-full"
        >
          Browse smocks
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Your cart</h1>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.size}-${item.color}`}
            className="flex gap-4 items-center border border-charcoal/10 rounded-xl p-3"
          >
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-cream shrink-0">
              {item.photo && (
                <Image src={item.photo} alt={item.title} fill className="object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.title}</p>
              <p className="text-sm text-muted">{item.shopName}</p>
              <p className="text-xs text-muted">
                {[item.size, item.color].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) =>
                  updateQuantity(
                    item.productId,
                    Math.max(1, Number(e.target.value)),
                    item.size,
                    item.color
                  )
                }
                className="w-14 text-center rounded-lg border border-charcoal/20 py-1 text-sm"
              />
            </div>
            <p className="font-semibold w-24 text-right">
              GHS {(item.priceGhs * item.quantity).toFixed(2)}
            </p>
            <button
              onClick={() => removeItem(item.productId, item.size, item.color)}
              className="text-muted hover:text-terracotta text-sm"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-8 border-t border-charcoal/10 pt-6">
        <p className="text-lg font-semibold">Total: GHS {total.toFixed(2)}</p>
        <Link
          href="/checkout"
          className="bg-terracotta text-white font-medium px-7 py-3 rounded-full hover:bg-charcoal transition-colors"
        >
          Proceed to checkout
        </Link>
      </div>
      <p className="text-xs text-muted mt-3">
        Orders from different shops are sent to each seller separately.
      </p>
    </div>
  );
}
