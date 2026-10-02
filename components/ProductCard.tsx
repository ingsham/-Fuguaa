import Link from "next/link";
import Image from "next/image";

export type ProductCardData = {
  id: string;
  title: string;
  priceGhs: string | number;
  photos: string[];
  shopName: string;
  verificationStatus?: string;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const photo = product.photos?.[0];

  return (
    <Link
      href={`/product/${product.id}`}
      className="group rounded-2xl overflow-hidden border border-charcoal/10 bg-white/60 hover:border-terracotta transition-colors"
    >
      <div className="relative aspect-[4/5] bg-cream">
        {photo ? (
          <Image
            src={photo}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted text-sm">
            No photo yet
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-sm truncate">{product.title}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-muted truncate">{product.shopName}</p>
          {product.verificationStatus === "approved" && (
            <span
              title="Verified seller"
              className="text-forest text-xs font-semibold shrink-0 ml-2"
            >
              ✓ Verified
            </span>
          )}
        </div>
        <p className="font-semibold mt-1">
          GHS {Number(product.priceGhs).toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
