# Fuguaa — Smock Marketplace

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · Neon Postgres · NextAuth · Paystack · Vercel Blob

## Status
- [x] Phase 1: schema, auth (signup/login, roles, rate limits), brand styling, home page, seed
- [ ] Phase 2: seller onboarding / Ghana Card flow
- [ ] Phase 3: listings, shop filters, product + storefront pages, favorites
- [ ] Phase 4: cart, Paystack checkout, escrow status flow, emails
- [ ] Phase 5: reviews, disputes, admin dashboard
- [ ] Phase 6: security pass

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env` and fill it in (Neon connection string, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`).
3. `npm run db:push` then `npm run db:seed`
4. `npm run dev` → http://localhost:3000

Seed login (change immediately): `admin@fuguaa.com` / `ChangeMe123!` (sellers: `kofi@example.com`, `ama@example.com`, same password).

## Deploy (GitHub → Vercel)
1. Push this folder to a new GitHub repo.
2. Vercel → Add New → Project → import the repo.
3. Add the env vars from `.env.example` (set `NEXTAUTH_URL` to your Vercel URL).
4. Deploy. Run `npm run db:push` once against your Neon DB (from your computer with `.env` set).

## Notes
- Prices are stored in pesewas (GHS × 100).
- Rate limiting is in-memory; move to Upstash Redis before heavy traffic.
- Never change `ENCRYPTION_KEY` after storing Ghana Card numbers.
