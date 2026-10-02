import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, products, orderItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/payments/paystack";

// Configure this URL in your Paystack dashboard: Settings > API Keys & Webhooks
// https://dashboard.paystack.com/#/settings/developer

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const reference = event.data.reference as string;

    const matchingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.paystackReference, reference));

    for (const order of matchingOrders) {
      await db
        .update(orders)
        .set({ status: "paid" })
        .where(eq(orders.id, order.id));

      // Decrement stock for each purchased item now that payment cleared.
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      for (const item of items) {
        await db
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }
    }
  }

  return NextResponse.json({ received: true });
}
