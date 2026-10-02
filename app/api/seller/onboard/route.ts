import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sellerProfiles } from "@/lib/db/schema";
import { encrypt } from "@/lib/crypto";

// NOTE on Ghana Card / NIA verification:
// The National Identification Authority does not currently offer a public
// self-serve verification API. This route stores the submitted Ghana Card
// number (encrypted at rest) and a photo of the card, and sets
// verificationStatus to "pending" for manual admin review — see
// /app/api/admin/sellers/[id]/verify/route.ts. If NIA or a third-party KYC
// provider later offers an API, swap the manual review step in that admin
// route for an automated call, using NIA_VERIFICATION_API_KEY from env.

const onboardSchema = z.object({
  shopName: z.string().min(2).max(150),
  bio: z.string().max(2000).optional(),
  region: z.string().max(100).optional(),
  ghanaCardNumber: z
    .string()
    .regex(/^GHA-\d{9}-\d$/, "Expected format: GHA-123456789-0"),
  ghanaCardDocUrl: z.string().url("Upload the ID document first"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = onboardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { shopName, bio, region, ghanaCardNumber, ghanaCardDocUrl } =
    parsed.data;

  const [profile] = await db
    .insert(sellerProfiles)
    .values({
      userId: session.user.id,
      shopName,
      bio,
      region,
      ghanaCardNumberEncrypted: encrypt(ghanaCardNumber),
      ghanaCardDocUrl,
      verificationStatus: "pending",
    })
    .returning({
      id: sellerProfiles.id,
      verificationStatus: sellerProfiles.verificationStatus,
    });

  return NextResponse.json({ sellerProfile: profile }, { status: 201 });
}
