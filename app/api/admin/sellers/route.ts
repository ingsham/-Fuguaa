import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sellerProfiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(sellerProfiles)
    .where(eq(sellerProfiles.verificationStatus, "pending"))
    .orderBy(desc(sellerProfiles.createdAt));

  return NextResponse.json({ sellers: rows });
}
