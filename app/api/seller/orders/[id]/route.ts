import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, sellerProfiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Sellers can only move an order forward through fulfilment — they can't
// mark it "delivered" themselves, since that's the buyer's confirmation
// step (see /api/orders/[id]/confirm-receipt) that starts the dispute
// window. This keeps the escrow trust model intact.
const updateSchema = z.object({
  status: z.enum(["confirmed", "shipped"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const [profile] = await db
    .select()
    .from(sellerProfiles)
    .where(eq(sellerProfiles.userId, session.user.id))
    .limit(1);

  if (!profile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [updated] = await db
    .update(orders)
    .set({ status: parsed.data.status })
    .where(and(eq(orders.id, id), eq(orders.sellerId, profile.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order: updated });
}
