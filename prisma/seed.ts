import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.user.upsert({ where: { email: "admin@fuguaa.com" }, update: {}, create: { email: "admin@fuguaa.com", name: "Fuguaa Admin", role: "ADMIN", passwordHash } });
  const sellers = [
    { email: "kofi@example.com", name: "Kofi Mensah", shop: "Mensah Looms", region: "Northern", bio: "Third-generation weaver from Tamale." },
    { email: "ama@example.com", name: "Ama Boateng", shop: "Ama Fugu House", region: "Upper East", bio: "Handwoven smocks for weddings and festivals." },
  ];
  for (const s of sellers) {
    const user = await prisma.user.upsert({ where: { email: s.email }, update: {}, create: { email: s.email, name: s.name, role: "SELLER", passwordHash } });
    await prisma.sellerProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, shopName: s.shop, bio: s.bio, region: s.region, verificationStatus: "APPROVED", verifiedAt: new Date() } });
    if ((await prisma.product.count({ where: { sellerId: user.id } })) === 0) {
      await prisma.product.createMany({ data: [
        { sellerId: user.id, title: `${s.shop} Classic Batakari`, description: "Handwoven cotton smock in traditional stripes.", priceGhs: 45000, stock: 8, photos: [], sizes: ["M", "L", "XL"], colors: ["Indigo", "Ochre"], fabricType: "Handwoven cotton", occasionTags: ["festival", "everyday"], sizeGuide: "M: chest 100cm. L: chest 108cm. XL: chest 116cm.", status: "ACTIVE" },
        { sellerId: user.id, title: `${s.shop} Wedding Smock`, description: "Fine-stitched smock for ceremonies.", priceGhs: 85000, stock: 3, photos: [], sizes: ["L", "XL"], colors: ["Cream", "Terracotta"], fabricType: "Silk-cotton blend", occasionTags: ["wedding"], sizeGuide: "L: chest 108cm. XL: chest 116cm.", status: "ACTIVE" },
      ] });
    }
  }
}
main().finally(() => prisma.$disconnect());
