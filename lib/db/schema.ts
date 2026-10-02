import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- Enums ----------
export const userRoleEnum = pgEnum("user_role", ["buyer", "seller", "admin"]);
export const verificationStatusEnum = pgEnum("verification_status", [
  "unsubmitted",
  "pending",
  "approved",
  "rejected",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "confirmed",
  "shipped",
  "delivered",
  "disputed",
  "cancelled",
]);
export const escrowStatusEnum = pgEnum("escrow_status", [
  "held",
  "released",
  "refunded",
]);
export const disputeStatusEnum = pgEnum("dispute_status", [
  "open",
  "under_review",
  "resolved",
  "rejected",
]);

// ---------- Users ----------
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("buyer"),
  phone: varchar("phone", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  sellerProfile: one(sellerProfiles, {
    fields: [users.id],
    references: [sellerProfiles.userId],
  }),
  ordersAsBuyer: many(orders),
  reviews: many(reviews),
}));

// ---------- Seller profiles ----------
export const sellerProfiles = pgTable("seller_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  shopName: varchar("shop_name", { length: 150 }).notNull(),
  bio: text("bio"),
  region: varchar("region", { length: 100 }),
  // Ghana Card number is encrypted at rest — see lib/crypto.ts
  ghanaCardNumberEncrypted: text("ghana_card_number_encrypted"),
  ghanaCardDocUrl: text("ghana_card_doc_url"),
  verificationStatus: verificationStatusEnum("verification_status")
    .notNull()
    .default("unsubmitted"),
  verificationNote: text("verification_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sellerProfilesRelations = relations(
  sellerProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [sellerProfiles.userId],
      references: [users.id],
    }),
    products: many(products),
  })
);

// ---------- Products ----------
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => sellerProfiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  priceGhs: numeric("price_ghs", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  sizes: jsonb("sizes").$type<string[]>().notNull().default([]),
  colors: jsonb("colors").$type<string[]>().notNull().default([]),
  fabricType: varchar("fabric_type", { length: 100 }),
  occasionTags: jsonb("occasion_tags").$type<string[]>().notNull().default([]),
  sizeGuide: text("size_guide"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(sellerProfiles, {
    fields: [products.sellerId],
    references: [sellerProfiles.id],
  }),
  orderItems: many(orderItems),
}));

// ---------- Orders ----------
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  buyerId: uuid("buyer_id")
    .notNull()
    .references(() => users.id),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => sellerProfiles.id),
  status: orderStatusEnum("status").notNull().default("pending_payment"),
  escrowStatus: escrowStatusEnum("escrow_status").notNull().default("held"),
  totalGhs: numeric("total_ghs", { precision: 10, scale: 2 }).notNull(),
  paystackReference: varchar("paystack_reference", { length: 100 }),
  deliveredAt: timestamp("delivered_at"),
  disputeDeadline: timestamp("dispute_deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, { fields: [orders.buyerId], references: [users.id] }),
  seller: one(sellerProfiles, {
    fields: [orders.sellerId],
    references: [sellerProfiles.id],
  }),
  items: many(orderItems),
  review: one(reviews, {
    fields: [orders.id],
    references: [reviews.orderId],
  }),
  dispute: one(disputes, {
    fields: [orders.id],
    references: [disputes.orderId],
  }),
}));

// ---------- Order items ----------
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  priceGhs: numeric("price_ghs", { precision: 10, scale: 2 }).notNull(),
  size: varchar("size", { length: 20 }),
  color: varchar("color", { length: 40 }),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// ---------- Reviews ----------
export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  buyerId: uuid("buyer_id")
    .notNull()
    .references(() => users.id),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => sellerProfiles.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
  order: one(orders, { fields: [reviews.orderId], references: [orders.id] }),
  buyer: one(users, { fields: [reviews.buyerId], references: [users.id] }),
  seller: one(sellerProfiles, {
    fields: [reviews.sellerId],
    references: [sellerProfiles.id],
  }),
}));

// ---------- Disputes ----------
export const disputes = pgTable("disputes", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: disputeStatusEnum("status").notNull().default("open"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const disputesRelations = relations(disputes, ({ one }) => ({
  order: one(orders, { fields: [disputes.orderId], references: [orders.id] }),
}));
