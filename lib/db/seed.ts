import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { db } from "./index";
import { users, sellerProfiles, products } from "./schema";

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  // --- Admin ---
  await db.insert(users).values({
    name: "Fuguaa Admin",
    email: "admin@fuguaa.test",
    passwordHash,
    role: "admin",
  });

  // --- Buyer ---
  await db.insert(users).values({
    name: "Ama Boateng",
    email: "buyer@fuguaa.test",
    passwordHash,
    role: "buyer",
  });

  // --- Seller 1 (verified) ---
  const [sellerUser1] = await db
    .insert(users)
    .values({
      name: "Sham-una Yussif",
      email: "seller1@fuguaa.test",
      passwordHash,
      role: "seller",
    })
    .returning();

  const [sellerProfile1] = await db
    .insert(sellerProfiles)
    .values({
      userId: sellerUser1.id,
      shopName: "Yussif Family Weaves",
      bio: "Three generations of weaving in Tamale. Every smock is made by hand, the same way my grandfather taught my father, and he taught me.",
      region: "Northern Region",
      verificationStatus: "approved",
    })
    .returning();

  await db.insert(products).values([
    {
      sellerId: sellerProfile1.id,
      title: "Classic Fugu Smock — Indigo Stripe",
      description:
        "A handwoven smock in deep indigo with traditional stripe detailing. Breathable cotton, perfect for festivals and everyday wear.",
      priceGhs: "450.00",
      stock: 8,
      photos: [
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
      ],
      sizes: ["M", "L", "XL"],
      colors: ["Indigo", "Natural"],
      fabricType: "Handwoven cotton",
      occasionTags: ["everyday", "festival"],
      sizeGuide:
        "M: chest 40in, shoulder 18in. L: chest 44in, shoulder 19in. XL: chest 48in, shoulder 20in.",
    },
    {
      sellerId: sellerProfile1.id,
      title: "Wedding Smock — Gold & White",
      description:
        "A premium ceremonial smock for weddings and formal occasions, finished with gold embroidery detail.",
      priceGhs: "950.00",
      stock: 4,
      photos: [
        "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800",
      ],
      sizes: ["L", "XL", "XXL"],
      colors: ["Gold/White"],
      fabricType: "Premium handwoven cotton",
      occasionTags: ["wedding"],
      sizeGuide:
        "L: chest 44in, shoulder 19in. XL: chest 48in, shoulder 20in. XXL: chest 52in, shoulder 21in.",
    },
  ]);

  // --- Seller 2 (pending verification, to populate the admin queue) ---
  const [sellerUser2] = await db
    .insert(users)
    .values({
      name: "Kojo Mensah",
      email: "seller2@fuguaa.test",
      passwordHash,
      role: "seller",
    })
    .returning();

  await db.insert(sellerProfiles).values({
    userId: sellerUser2.id,
    shopName: "Mensah Textiles",
    bio: "Weaving batakari and smocks for every occasion.",
    region: "Upper East Region",
    ghanaCardNumberEncrypted: "placeholder-encrypted-value",
    ghanaCardDocUrl: "https://example.com/id-doc.jpg",
    verificationStatus: "pending",
  });

  console.log("Seed complete:");
  console.log(`  Admin:  admin@fuguaa.test / password123`);
  console.log(`  Buyer:  buyer@fuguaa.test / password123`);
  console.log(`  Seller (verified): seller1@fuguaa.test / password123`);
  console.log(`  Seller (pending):  seller2@fuguaa.test / password123`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
