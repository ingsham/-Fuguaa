import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { products, sellerProfiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
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
      isActive: products.isActive,
      shopName: sellerProfiles.shopName,
      createdAt: products.createdAt,
    })
    .from(products)
    .innerJoin(sellerProfiles, eq(products.sellerId, sellerProfiles.id))
    .orderBy(desc(products.createdAt));

  return NextResponse.json({ products: rows });
}
