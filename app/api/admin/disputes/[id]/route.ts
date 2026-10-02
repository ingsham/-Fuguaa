import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { disputes, orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const resolveSchema = z.object({
  status: z.enum(["resolved", "rejected"]),
  adminNote: z.string().max(2000).optional(),
  // If resolved in the buyer's favor, mark the order refunded instead of
  // delivered/released. Actual fund movement via Paystack Refunds API is
  // a manual step for the admin to trigger from the Paystack dashboard
  // until that's wired in here.
  refundBuyer: z.boolean().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const [dispute] = await db
    .update(disputes)
    .set({
      status: parsed.data.status,
      adminNote: parsed.data.adminNote,
    })
    .where(eq(disputes.id, id))
    .returning();

  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  if (parsed.data.refundBuyer) {
    await db
      .update(orders)
      .set({ escrowStatus: "refunded" })
      .where(eq(orders.id, dispute.orderId));
  } else if (parsed.data.status === "rejected") {
    await db
      .update(orders)
      .set({ escrowStatus: "released", status: "delivered" })
      .where(eq(orders.id, dispute.orderId));
  }

  return NextResponse.json({ dispute });
}
