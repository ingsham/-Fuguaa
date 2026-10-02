import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, sellerProfiles, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [profile] = await db
    .select()
    .from(sellerProfiles)
    .where(eq(sellerProfiles.userId, session.user.id))
    .limit(1);

  if (!profile) return NextResponse.json({ orders: [] });

  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      escrowStatus: orders.escrowStatus,
      totalGhs: orders.totalGhs,
      createdAt: orders.createdAt,
      buyerName: users.name,
    })
    .from(orders)
    .innerJoin(users, eq(orders.buyerId, users.id))
    .where(eq(orders.sellerId, profile.id))
    .orderBy(desc(orders.createdAt));

  return NextResponse.json({ orders: rows });
}
