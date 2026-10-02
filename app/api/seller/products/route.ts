import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { products, sellerProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const productSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  priceGhs: z.number().positive(),
  stock: z.number().int().nonnegative(),
  photos: z.array(z.string().url()).min(1, "Add at least one photo"),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  fabricType: z.string().max(100).optional(),
  occasionTags: z.array(z.string()).default([]),
  sizeGuide: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [profile] = await db
    .select()
    .from(sellerProfiles)
    .where(eq(sellerProfiles.userId, session.user.id))
    .limit(1);

  if (!profile) {
    return NextResponse.json(
      { error: "Complete seller onboarding first" },
      { status: 403 }
    );
  }

  if (profile.verificationStatus !== "approved") {
    return NextResponse.json(
      {
        error:
          "Your seller account is pending verification. You can list products once an admin approves your Ghana Card verification.",
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const [product] = await db
    .insert(products)
    .values({
      sellerId: profile.id,
      ...parsed.data,
      priceGhs: parsed.data.priceGhs.toString(),
    })
    .returning();

  return NextResponse.json({ product }, { status: 201 });
}

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

  if (!profile) return NextResponse.json({ products: [] });

  const rows = await db
    .select()
    .from(products)
    .where(eq(products.sellerId, profile.id));

  return NextResponse.json({ products: rows });
}
