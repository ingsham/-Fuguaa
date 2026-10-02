import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, reviews } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const reviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  photos: z.array(z.string().url()).default([]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  // Reviews are only allowed on the buyer's own orders that have reached
  // "delivered" status — this is the "reviews tied to verified purchases
  // only" trust mechanism from the plan, preventing fake reviews.
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.id, parsed.data.orderId),
        eq(orders.buyerId, session.user.id)
      )
    )
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "delivered") {
    return NextResponse.json(
      { error: "You can only review orders that have been delivered." },
      { status: 403 }
    );
  }

  const [review] = await db
    .insert(reviews)
    .values({
      orderId: order.id,
      buyerId: session.user.id,
      sellerId: order.sellerId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      photos: parsed.data.photos,
    })
    .returning();

  return NextResponse.json({ review }, { status: 201 });
}
