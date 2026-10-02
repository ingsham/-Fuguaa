import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { products, orders, orderItems } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { initializeTransaction } from "@/lib/payments/paystack";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        size: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid cart" },
      { status: 400 }
    );
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  const dbProducts = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  if (dbProducts.length !== productIds.length) {
    return NextResponse.json(
      { error: "One or more items are no longer available" },
      { status: 400 }
    );
  }

  // Group cart items by seller — each seller gets its own order, since a
  // single cart can span multiple shops (see plan: "multi-seller cart").
  const bySeller = new Map<string, typeof parsed.data.items>();
  for (const item of parsed.data.items) {
    const product = dbProducts.find((p) => p.id === item.productId)!;
    if (item.quantity > product.stock) {
      return NextResponse.json(
        { error: `Not enough stock for "${product.title}"` },
        { status: 400 }
      );
    }
    const list = bySeller.get(product.sellerId) ?? [];
    list.push(item);
    bySeller.set(product.sellerId, list);
  }

  const reference = `fuguaa_${randomUUID()}`;
  let grandTotal = 0;
  const createdOrderIds: string[] = [];

  for (const [sellerId, items] of bySeller) {
    let sellerTotal = 0;
    const rowsToInsert = items.map((item) => {
      const product = dbProducts.find((p) => p.id === item.productId)!;
      const lineTotal = Number(product.priceGhs) * item.quantity;
      sellerTotal += lineTotal;
      return {
        productId: product.id,
        quantity: item.quantity,
        priceGhs: product.priceGhs,
        size: item.size,
        color: item.color,
      };
    });

    const [order] = await db
      .insert(orders)
      .values({
        buyerId: session.user.id,
        sellerId,
        totalGhs: sellerTotal.toString(),
        paystackReference: reference,
        status: "pending_payment",
        escrowStatus: "held",
      })
      .returning({ id: orders.id });

    await db
      .insert(orderItems)
      .values(rowsToInsert.map((r) => ({ ...r, orderId: order.id })));

    createdOrderIds.push(order.id);
    grandTotal += sellerTotal;
  }

  try {
    const paystackRes = await initializeTransaction({
      email: session.user.email!,
      amountGhs: grandTotal,
      reference,
      callbackUrl: `${process.env.NEXTAUTH_URL}/orders`,
      metadata: { orderIds: createdOrderIds, userId: session.user.id },
    });

    return NextResponse.json({
      authorizationUrl: paystackRes.data.authorization_url,
      reference,
    });
  } catch (err) {
    // Paystack init failed (bad/missing key, network issue, etc.) — don't
    // leave abandoned pending_payment orders behind. orderItems cascade-
    // delete with their parent order (see schema's onDelete: "cascade").
    await db.delete(orders).where(inArray(orders.id, createdOrderIds));

    console.error("Checkout init failed:", err);
    return NextResponse.json(
      {
        error:
          "Could not start payment. Please try again in a moment, or contact support if this continues.",
      },
      { status: 502 }
    );
  }
}
