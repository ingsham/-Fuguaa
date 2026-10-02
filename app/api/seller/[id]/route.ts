import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sellerProfiles, products, reviews } from "@/lib/db/schema";
import { eq, avg, count } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [seller] = await db
    .select({
      id: sellerProfiles.id,
      shopName: sellerProfiles.shopName,
      bio: sellerProfiles.bio,
      region: sellerProfiles.region,
      verificationStatus: sellerProfiles.verificationStatus,
    })
    .from(sellerProfiles)
    .where(eq(sellerProfiles.id, id))
    .limit(1);

  if (!seller) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const sellerProducts = await db
    .select()
    .from(products)
    .where(eq(products.sellerId, id));

  const [ratingRow] = await db
    .select({ avgRating: avg(reviews.rating), reviewCount: count(reviews.id) })
    .from(reviews)
    .where(eq(reviews.sellerId, id));

  return NextResponse.json({
    seller,
    products: sellerProducts,
    rating: {
      average: ratingRow?.avgRating ? Number(ratingRow.avgRating) : null,
      count: ratingRow?.reviewCount ?? 0,
    },
  });
}
