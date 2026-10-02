import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, sellerProfiles } from "@/lib/db/schema";
import { and, eq, gte, lte, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const region = searchParams.get("region");
  const occasion = searchParams.get("occasion");
  const material = searchParams.get("material");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const conditions = [eq(products.isActive, true)];

  if (q) conditions.push(ilike(products.title, `%${q}%`));
  if (minPrice) conditions.push(gte(products.priceGhs, minPrice));
  if (maxPrice) conditions.push(lte(products.priceGhs, maxPrice));
  if (region) conditions.push(eq(sellerProfiles.region, region));
  if (material) conditions.push(ilike(products.fabricType, `%${material}%`));

  const rows = await db
    .select({
      id: products.id,
      title: products.title,
      priceGhs: products.priceGhs,
      photos: products.photos,
      occasionTags: products.occasionTags,
      fabricType: products.fabricType,
      sellerId: products.sellerId,
      shopName: sellerProfiles.shopName,
      verificationStatus: sellerProfiles.verificationStatus,
    })
    .from(products)
    .innerJoin(sellerProfiles, eq(products.sellerId, sellerProfiles.id))
    .where(and(...conditions))
    .limit(60);

  // occasion filter applied in JS since it's inside a jsonb array
  const filtered = occasion
    ? rows.filter((r) => (r.occasionTags as string[]).includes(occasion))
    : rows;

  return NextResponse.json({ products: filtered });
}
