"use client";

import { useEffect, useState, use as usePromise } from "react";
import { ProductCard, ProductCardData } from "@/components/ProductCard";

type SellerData = {
  id: string;
  shopName: string;
  bio: string | null;
  region: string | null;
  verificationStatus: string;
};

export default function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = usePromise(params);
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [rating, setRating] = useState<{ average: number | null; count: number }>({
    average: null,
    count: 0,
  });

  useEffect(() => {
    fetch(`/api/seller/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.seller) {
          setSeller(data.seller);
          setProducts(
            data.products.map((p: ProductCardData) => ({
              ...p,
              shopName: data.seller.shopName,
              verificationStatus: data.seller.verificationStatus,
            }))
          );
          setRating(data.rating);
        }
      });
  }, [id]);

  if (!seller) {
    return <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 text-muted">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-10">
      <div className="bg-cream/60 rounded-2xl p-8 mb-10">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold">{seller.shopName}</h1>
          {seller.verificationStatus === "approved" && (
            <span className="text-forest text-sm font-semibold">
              ✓ Verified seller
            </span>
          )}
        </div>
        {seller.region && (
          <p className="text-sm text-muted mt-1">{seller.region}</p>
        )}
        {rating.count > 0 && (
          <p className="text-sm text-muted mt-1">
            ★ {rating.average?.toFixed(1)} ({rating.count} review
            {rating.count === 1 ? "" : "s"})
          </p>
        )}
        {seller.bio && (
          <p
            className="mt-4 text-charcoal/80 italic max-w-2xl"
            style={{ fontFamily: "var(--font-voice)" }}
          >
            {seller.bio}
          </p>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-5">Listings</h2>
      {products.length === 0 ? (
        <p className="text-muted">This shop hasn&apos;t listed anything yet.</p>
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
