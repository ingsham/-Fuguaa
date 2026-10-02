import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sellerProfiles, orders } from "@/lib/db/schema";
import { count, sum, eq, ne } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [sellerCount] = await db
    .select({ total: count() })
    .from(sellerProfiles)
    .where(eq(sellerProfiles.verificationStatus, "approved"));

  // Only count orders that actually completed payment — an abandoned
  // checkout (e.g. the buyer never finished paying) shouldn't inflate
  // order count or gross merchandise value.
  const [orderCount] = await db
    .select({ total: count() })
    .from(orders)
    .where(ne(orders.status, "pending_payment"));

  const [gmv] = await db
    .select({ total: sum(orders.totalGhs) })
    .from(orders)
    .where(ne(orders.status, "pending_payment"));

  return NextResponse.json({
    verifiedSellers: sellerCount?.total ?? 0,
    totalOrders: orderCount?.total ?? 0,
    gmvGhs: gmv?.total ? Number(gmv.total) : 0,
  });
}
