import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, sellerProfiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      escrowStatus: orders.escrowStatus,
      totalGhs: orders.totalGhs,
      createdAt: orders.createdAt,
      deliveredAt: orders.deliveredAt,
      shopName: sellerProfiles.shopName,
    })
    .from(orders)
    .innerJoin(sellerProfiles, eq(orders.sellerId, sellerProfiles.id))
    .where(eq(orders.buyerId, session.user.id))
    .orderBy(desc(orders.createdAt));

  return NextResponse.json({ orders: rows });
}
