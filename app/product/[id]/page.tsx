"use client";

import { useEffect, useState, use as usePromise } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart/context";

type ProductDetail = {
  id: string;
  title: string;
  description: string | null;
  priceGhs: string;
  stock: number;
  photos: string[];
  sizes: string[];
  colors: string[];
  fabricType: string | null;
  occasionTags: string[];
  sizeGuide: string | null;
  sellerId: string;
  shopName: string;
  shopBio: string | null;
  shopRegion: string | null;
  verificationStatus: string;
};

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = usePromise(params);
  const { addItem } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [rating, setRating] = useState<{ average: number | null; count: number }>({
    average: null,
    count: 0,
  });
  const [activePhoto, setActivePhoto] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.product) {
          setProduct(data.product);
          setRating(data.rating);
          setSize(data.product.sizes?.[0] ?? "");
          setColor(data.product.colors?.[0] ?? "");
        }
      });
  }, [id]);

  if (!product) {
    return <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 text-muted">Loading...</div>;
  }

  function handleAddToCart() {
    if (!product) return;
    addItem({
      productId: product.id,
      title: product.title,
      priceGhs: Number(product.priceGhs),
      photo: product.photos?.[0],
      shopName: product.shopName,
      size: size || undefined,
      color: color || undefined,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-10 grid sm:grid-cols-2 gap-10">
      {/* Gallery */}
      <div>
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-cream">
          {product.photos?.[activePhoto] ? (
            <Image
              src={product.photos[activePhoto]}
              alt={product.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted">
              No photo yet
            </div>
          )}
        </div>
        {product.photos?.length > 1 && (
          <div className="flex gap-2 mt-3">
            {product.photos.map((p, i) => (
              <button
                key={p + i}
                onClick={() => setActivePhoto(i)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  i === activePhoto ? "border-terracotta" : "border-transparent"
                }`}
              >
                <Image src={p} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div>
        <h1 className="text-2xl font-semibold">{product.title}</h1>
        <Link
          href={`/seller/${product.sellerId}`}
          className="text-muted hover:text-terracotta text-sm flex items-center gap-2 mt-1"
        >
          {product.shopName}
          {product.verificationStatus === "approved" && (
            <span className="text-forest font-semibold">✓ Verified seller</span>
          )}
        </Link>
        {rating.count > 0 && (
          <p className="text-sm text-muted mt-1">
            ★ {rating.average?.toFixed(1)} ({rating.count} review
            {rating.count === 1 ? "" : "s"})
          </p>
        )}

        <p className="text-2xl font-semibold mt-4">
          GHS {Number(product.priceGhs).toFixed(2)}
        </p>

        {product.description && (
          <p className="text-sm text-charcoal/80 mt-4 whitespace-pre-line">
            {product.description}
          </p>
        )}

        {product.sizes?.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-medium mb-1">Size</p>
            <div className="flex gap-2 flex-wrap">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    size === s
                      ? "bg-indigo text-cream border-indigo"
                      : "border-charcoal/20"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.colors?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-1">Color</p>
            <div className="flex gap-2 flex-wrap">
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    color === c
                      ? "bg-indigo text-cream border-indigo"
                      : "border-charcoal/20"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.sizeGuide && (
          <details className="mt-5 text-sm">
            <summary className="cursor-pointer font-medium">Size guide</summary>
            <p className="mt-2 text-charcoal/80 whitespace-pre-line">
              {product.sizeGuide}
            </p>
          </details>
        )}

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="mt-7 w-full sm:w-auto bg-terracotta text-white font-medium px-8 py-3 rounded-full hover:bg-charcoal transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {product.stock === 0
            ? "Out of stock"
            : added
            ? "Added ✓"
            : "Add to cart"}
        </button>

        <p className="text-xs text-muted mt-4">
          Payment is held until you confirm your order arrived. You have 72
          hours after delivery to report an issue.
        </p>
      </div>
    </div>
  );
}
