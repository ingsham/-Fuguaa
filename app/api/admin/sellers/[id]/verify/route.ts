import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sellerProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const verifySchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(1000).optional(),
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
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(sellerProfiles)
    .set({
      verificationStatus: parsed.data.decision,
      verificationNote: parsed.data.note,
    })
    .where(eq(sellerProfiles.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  return NextResponse.json({ sellerProfile: updated });
}
