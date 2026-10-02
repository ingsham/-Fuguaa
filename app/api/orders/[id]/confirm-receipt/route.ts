import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const DISPUTE_WINDOW_HOURS = 72;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.buyerId, session.user.id)))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const disputeDeadline = new Date(
    Date.now() + DISPUTE_WINDOW_HOURS * 60 * 60 * 1000
  );

  // NOTE on escrow: this marks the order delivered and schedules the
  // dispute window. Actual release of held funds to the seller's payout
  // (via Paystack Transfers API, which requires a separate Paystack
  // business verification step) should run after disputeDeadline passes
  // with no open dispute — wire that into a scheduled job (e.g. a Vercel
  // Cron route) once Paystack Transfers is set up for this account.
  const [updated] = await db
    .update(orders)
    .set({
      status: "delivered",
      deliveredAt: new Date(),
      disputeDeadline,
    })
    .where(eq(orders.id, id))
    .returning();

  return NextResponse.json({ order: updated });
}
