"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductCard, ProductCardData } from "@/components/ProductCard";

const OCCASIONS = ["wedding", "funeral", "festival", "everyday"];

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const occasion = searchParams.get("occasion") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchParams.get("q")) params.set("q", searchParams.get("q")!);
    if (occasion) params.set("occasion", occasion);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);

    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products ?? []);
    } finally {
      setLoading(false);
    }
  }, [searchParams, occasion, minPrice, maxPrice]);

  useEffect(() => {
    // Fetching data from our own API in response to filter/search changes
    // — a standard "synchronize with an external system" effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/shop?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Shop smocks</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParam("q", q);
        }}
        className="flex flex-wrap gap-3 mb-8"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search smocks..."
          className="flex-1 min-w-[200px] rounded-full border border-charcoal/20 px-4 py-2 text-sm"
        />
        <select
          value={occasion}
          onChange={(e) => updateParam("occasion", e.target.value)}
          className="rounded-full border border-charcoal/20 px-4 py-2 text-sm bg-white"
        >
          <option value="">All occasions</option>
          {OCCASIONS.map((o) => (
            <option key={o} value={o}>
              {o[0].toUpperCase() + o.slice(1)}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Min GHS"
          value={minPrice}
          onChange={(e) => updateParam("minPrice", e.target.value)}
          className="w-28 rounded-full border border-charcoal/20 px-4 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Max GHS"
          value={maxPrice}
          onChange={(e) => updateParam("maxPrice", e.target.value)}
          className="w-28 rounded-full border border-charcoal/20 px-4 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-indigo text-cream px-5 py-2 text-sm font-medium"
        >
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-muted">
          No smocks match yet. Try a different filter, or check back soon as
          more sellers join.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-10 text-muted">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
