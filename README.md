# Fuguaa

A marketplace connecting real smock weavers across Ghana directly with
buyers. Built with Next.js, Drizzle ORM, NextAuth, and Paystack.

This project was built and tested end-to-end (migrations run, seed data
loaded, every page and API route exercised against a real local
PostgreSQL database, production build verified clean) before being
handed over. What's below is what you need to get it running yourself
and take it to production.

## Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL, via Drizzle ORM (not Prisma — Drizzle is
  pure JS/TS with no native binary engine, which makes it simpler to
  deploy on Vercel)
- **Auth:** NextAuth.js v5 (credentials provider, JWT sessions,
  role-based: buyer / seller / admin)
- **Payments:** Paystack (Mobile Money + card, standard for Ghana)
- **Deployment target:** Vercel

## 1. Set up accounts you'll need

Before this app is fully functional, sign up for these and drop the
keys into `.env.local` (copy `.env.example` to start):

### Database — Neon or Supabase (free tier is enough to start)
1. Create a project at neon.tech or supabase.com
2. Copy the connection string into `DATABASE_URL`

### Paystack — payments (Mobile Money + card)
1. Sign up at paystack.com
2. Use your **test** secret/public keys while developing
   (`PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`)
3. Switch to live keys only once you're ready to accept real payments
4. In the Paystack dashboard, add a webhook pointing to
   `https://yourdomain.com/api/checkout/webhook` — this is what marks
   an order "paid" after a successful transaction

### Ghana Card / NIA verification — manual for now
There is currently no public self-serve API from the National
Identification Authority for third parties to verify Ghana Cards
automatically. This app implements verification as a **manual
admin-review flow** instead: a seller submits their Ghana Card number
and a photo of the card, and an admin approves or rejects it from
`/dashboard/admin`. The `NIA_VERIFICATION_API_KEY` env var is reserved
for if/when an official API becomes available to you — wiring it in
would mean replacing the manual approve/reject step in
`app/api/admin/sellers/[id]/verify/route.ts` with an automated check.

### Email (optional, for order confirmation emails)
Not wired in yet. Resend (resend.com) is a good fit if you want to add
this — see "What's not built yet" below.

## 2. Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values above
npm run db:generate          # generate SQL migration from the schema
npm run db:migrate           # apply it to your database
npm run db:seed              # load sample sellers/products + test accounts
npm run dev
```

Visit http://localhost:3000.

### Test accounts (from the seed script)
| Role              | Email                | Password    |
|-------------------|-----------------------|-------------|
| Admin             | admin@fuguaa.test     | password123 |
| Buyer             | buyer@fuguaa.test     | password123 |
| Seller (verified) | seller1@fuguaa.test   | password123 |
| Seller (pending)  | seller2@fuguaa.test   | password123 |

**Delete or change these before going live.**

## 3. Deploying to Vercel

1. Push this repo to GitHub
2. Import it in Vercel
3. Add all the same env vars from `.env.local` in Vercel's project
   settings (use your **production** Paystack keys, a fresh
   `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32` — and
   your production `DATABASE_URL`)
4. Set `NEXTAUTH_URL` to your actual deployed URL
5. Run `npm run db:migrate` once against your production database
   (from your machine, with `DATABASE_URL` pointed at production) before
   first launch
6. Deploy

## Project structure

```
app/
  (auth)/signup, login        — auth pages
  seller-onboarding/          — Ghana Card submission flow
  shop/                       — browse/search/filter
  product/[id]/               — product detail + add to cart
  seller/[id]/                — public storefront
  cart/, checkout/, orders/   — buyer purchase flow
  dashboard/seller/           — seller's listings + incoming orders
  dashboard/admin/            — verification queue, disputes, metrics
  api/                        — all backend routes
components/                   — shared UI (Header, Footer, ProductCard)
lib/
  db/schema.ts                — full Drizzle schema
  auth/                       — NextAuth config
  payments/paystack.ts        — Paystack integration
  crypto.ts                   — encryption for Ghana Card numbers at rest
  cart/context.tsx            — client-side cart (localStorage-backed)
```

## Database schema

Seven tables: users, seller_profiles, products, orders, order_items,
reviews, disputes. Full definitions in lib/db/schema.ts. Key design
decisions:

- **Escrow-style orders:** every order has an escrowStatus (held →
  released/refunded). Payment is captured at checkout but conceptually
  "held" until the buyer confirms receipt
  (/api/orders/[id]/confirm-receipt) or a dispute is resolved by an
  admin. This matches the trust model from the project plan — payment
  isn't released to a seller just because they shipped something.
- **Reviews require a completed order:** reviews.orderId is unique and
  references orders, so a buyer can only review after an actual
  purchase — no fake reviews.
- **Ghana Card numbers are encrypted at rest** (AES-256-GCM, see
  lib/crypto.ts) using ENCRYPTION_KEY. Generate your own with
  `openssl rand -hex 32` — don't use the placeholder in .env.example in
  production.

## Security notes

- Passwords are hashed with bcrypt (12 rounds)
- Raw card payment details are never touched by this app — Paystack's
  hosted checkout handles that entirely (PCI compliance stays with them)
- Ghana Card numbers are encrypted before being stored
- All API routes that touch user-specific or role-gated data check
  auth() and the user's role before doing anything
- Input is validated with Zod on every write endpoint

Before a real launch, also add: rate limiting on /api/signup and the
login endpoint (e.g. with Upstash's rate limit package, which pairs
well with Vercel), and a dependency security audit (npm audit).

## What's not built yet (known MVP gaps)

Built everything we discussed in the plan, but being upfront about
what's simplified for now so nothing surprises you at launch:

- **Photo uploads are URL-only.** Sellers paste image URLs rather than
  uploading files directly. Wire in Vercel Blob or Cloudinary for real
  file upload — the photos field already stores an array of URLs, so
  this is a frontend-only change (swap the comma-separated text input
  in app/dashboard/seller/page.tsx for an upload widget).
- **No order confirmation emails yet.** Wire in Resend or similar in
  app/api/checkout/webhook/route.ts once a payment succeeds.
- **No automated Ghana Card verification** (see note above — this is a
  limitation of what's publicly available, not something left out).
- **No rate limiting yet** on auth endpoints — add before real launch.
- **Occasion filter tags are free text** entered by sellers — for a
  cleaner buyer experience later, consider making this a fixed dropdown
  enforced at the database level.

None of these block a real pilot launch with your first 10–20 sellers
(per the plan's bootstrapped launch approach) — they're the natural
next additions once you have real usage to guide priorities.
