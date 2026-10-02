import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { disputes, orders, sellerProfiles } from "@/lib/db/schema";
import { eq, desc, or } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: disputes.id,
      orderId: disputes.orderId,
      reason: disputes.reason,
      status: disputes.status,
      createdAt: disputes.createdAt,
      shopName: sellerProfiles.shopName,
      totalGhs: orders.totalGhs,
    })
    .from(disputes)
    .innerJoin(orders, eq(disputes.orderId, orders.id))
    .innerJoin(sellerProfiles, eq(orders.sellerId, sellerProfiles.id))
    .where(or(eq(disputes.status, "open"), eq(disputes.status, "under_review")))
    .orderBy(desc(disputes.createdAt));

  return NextResponse.json({ disputes: rows });
}
