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
    {
      sellerId: sellerProfile1.id,
      title: "Mourning Smock — Black & Red",
      description:
        "A traditional funeral smock in black and red, woven in the style worn across the Northern and Upper regions for funerals and remembrance.",
      priceGhs: "500.00",
      stock: 6,
      photos: [
        "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800",
      ],
      sizes: ["M", "L", "XL"],
      colors: ["Black/Red"],
      fabricType: "Handwoven cotton",
      occasionTags: ["funeral"],
      sizeGuide:
        "M: chest 40in, shoulder 18in. L: chest 44in, shoulder 19in. XL: chest 48in, shoulder 20in.",
    },
    {
      sellerId: sellerProfile1.id,
      title: "Damba Festival Smock — Multicolor",
      description:
        "A vibrant multicolor smock made for Damba and other northern festivals, with bold woven stripes in traditional festival colors.",
      priceGhs: "480.00",
      stock: 10,
      photos: [
        "https://images.unsplash.com/photo-1583846717393-dc2412c95ed7?w=800",
      ],
      sizes: ["S", "M", "L", "XL"],
      colors: ["Multicolor"],
      fabricType: "Kente-trim cotton",
      occasionTags: ["festival"],
      sizeGuide:
        "S: chest 36in, shoulder 17in. M: chest 40in, shoulder 18in. L: chest 44in, shoulder 19in. XL: chest 48in, shoulder 20in.",
    },
    {
      sellerId: sellerProfile1.id,
      title: "Everyday Fugu — Lightweight Natural",
      description:
        "A simpler, lighter-weight smock for daily wear — easy to move in, breathable, and comfortable for the heat.",
      priceGhs: "280.00",
      stock: 15,
      photos: [
        "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800",
      ],
      sizes: ["S", "M", "L", "XL"],
      colors: ["Natural", "Grey"],
      fabricType: "Lightweight cotton",
      occasionTags: ["everyday"],
      sizeGuide:
        "S: chest 36in, shoulder 17in. M: chest 40in, shoulder 18in. L: chest 44in, shoulder 19in. XL: chest 48in, shoulder 20in.",
    },
    {
      sellerId: sellerProfile1.id,
      title: "Little Chief Smock — Kids' Festival Fugu",
      description:
        "A scaled-down smock for boys, made the same way as the adult versions — perfect for festivals, naming ceremonies, and family photos.",
      priceGhs: "180.00",
      stock: 12,
      photos: [
        "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800",
      ],
      sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
      colors: ["Indigo", "Multicolor"],
      fabricType: "Lightweight cotton",
      occasionTags: ["children", "festival"],
      sizeGuide:
        "2-3Y: chest 22in. 4-5Y: chest 24in. 6-7Y: chest 26in. 8-9Y: chest 28in.",
    },
    {
      sellerId: sellerProfile1.id,
      title: "Junior Wedding Smock — White & Gold",
      description:
        "A formal children's smock for weddings and naming ceremonies, matching the adult gold-and-white wedding line.",
      priceGhs: "220.00",
      stock: 7,
      photos: [
        "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800",
      ],
      sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y"],
      colors: ["Gold/White"],
      fabricType: "Cotton-silk blend",
      occasionTags: ["children", "wedding"],
      sizeGuide:
        "4-5Y: chest 24in. 6-7Y: chest 26in. 8-9Y: chest 28in. 10-11Y: chest 30in.",
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
