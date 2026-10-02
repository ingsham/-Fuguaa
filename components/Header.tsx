"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/cart/context";

export function Header() {
  const { data: session } = useSession();
  const { items } = useCart();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <header className="border-b border-charcoal/10 bg-background/95 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/fuguaa_logo.svg"
            alt="Fuguaa"
            width={36}
            height={36}
            priority
          />
          <span className="text-xl font-semibold tracking-tight text-charcoal">
            fuguaa
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-charcoal">
          <Link href="/shop" className="hover:text-terracotta transition-colors">
            Shop
          </Link>
          {session?.user?.role === "seller" && (
            <Link
              href="/dashboard/seller"
              className="hover:text-terracotta transition-colors"
            >
              My shop
            </Link>
          )}
          {session?.user?.role === "admin" && (
            <Link
              href="/dashboard/admin"
              className="hover:text-terracotta transition-colors"
            >
              Admin
            </Link>
          )}
          {session?.user && (
            <Link href="/orders" className="hover:text-terracotta transition-colors">
              Orders
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="relative text-sm font-medium text-charcoal hover:text-terracotta transition-colors"
          >
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-terracotta text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          {session?.user ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm font-medium text-muted hover:text-terracotta transition-colors"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium bg-indigo text-cream px-4 py-2 rounded-full hover:bg-charcoal transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
      <div className="weave-divider" />
    </header>
  );
}
