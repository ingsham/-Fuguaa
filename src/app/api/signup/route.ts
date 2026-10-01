import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(8).max(100),
  role: z.enum(["BUYER", "SELLER"]), // admins are created via seed/DB only
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`signup:${ip}`, 5, 60 * 60_000)) return NextResponse.json({ error: "Too many signups. Try later." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check your details (password needs 8+ characters)." }, { status: 400 });
  const { name, email, password, role } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
  await prisma.user.create({ data: { name, email, role, passwordHash: await bcrypt.hash(password, 12) } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
