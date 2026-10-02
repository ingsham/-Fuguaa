import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, disputes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const disputeSchema = z.object({
  reason: z.string().min(10).max(2000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = disputeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.buyerId, session.user.id)))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.disputeDeadline && new Date() > order.disputeDeadline) {
    return NextResponse.json(
      { error: "The dispute window for this order has closed." },
      { status: 400 }
    );
  }

  await db
    .update(orders)
    .set({ status: "disputed" })
    .where(eq(orders.id, id));

  const [dispute] = await db
    .insert(disputes)
    .values({ orderId: id, reason: parsed.data.reason })
    .returning();

  return NextResponse.json({ dispute }, { status: 201 });
}
