import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, sellerProfiles, reviews } from "@/lib/db/schema";
import { eq, avg, count } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [row] = await db
    .select({
      id: products.id,
      title: products.title,
      description: products.description,
      priceGhs: products.priceGhs,
      stock: products.stock,
      photos: products.photos,
      sizes: products.sizes,
      colors: products.colors,
      fabricType: products.fabricType,
      occasionTags: products.occasionTags,
      sizeGuide: products.sizeGuide,
      sellerId: products.sellerId,
      shopName: sellerProfiles.shopName,
      shopBio: sellerProfiles.bio,
      shopRegion: sellerProfiles.region,
      verificationStatus: sellerProfiles.verificationStatus,
    })
    .from(products)
    .innerJoin(sellerProfiles, eq(products.sellerId, sellerProfiles.id))
    .where(eq(products.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const [ratingRow] = await db
    .select({
      avgRating: avg(reviews.rating),
      reviewCount: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.sellerId, row.sellerId));

  return NextResponse.json({
    product: row,
    rating: {
      average: ratingRow?.avgRating ? Number(ratingRow.avgRating) : null,
      count: ratingRow?.reviewCount ?? 0,
    },
  });
}
