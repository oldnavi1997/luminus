# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint

# Database
npx prisma migrate dev --name <name>   # Create + apply migration (dev)
npx prisma migrate deploy              # Apply migrations (prod)
npx prisma generate                    # Regenerate Prisma client
npx prisma studio                      # DB GUI
npx tsx prisma/seed.ts                 # Run seed manually
```

Local DB: PostgreSQL on port 5433 (non-standard). Set `DATABASE_URL` in `.env.local`.

## Architecture

Next.js 16 App Router, React 19. No `src/` dir. All pages under `app/`, components under `components/`.

**Key sections:**
- `app/` — pages + API routes (App Router)
- `components/` — organized by domain: `ui/`, `layout/`, `home/`, `catalog/`, `product/`, `cart/`, `checkout/`, `admin/`
- `lib/` — prisma, auth, mercadopago, cloudinary, utils
- `stores/` — Zustand cart store (`luminus-cart` key in localStorage)
- `types/` — shared TypeScript types (`ProductWithCategory`, `OrderWithItems`, `CartItem`)
- `prisma/` — schema, migrations, seed

**Route protection:** `app/admin/layout.tsx` is a Server Component that checks `getServerSession()` and redirects non-ADMIN users.

**Dynamic pages:** `app/page.tsx` and `app/lentes/page.tsx` export `export const dynamic = "force-dynamic"` to prevent static generation errors during build when DB is unreachable.

## Critical: Shared Prisma schema with POS

The Postgres DB (`luminus` local on :5433, single Postgres service on Railway) is **shared** with the sister project `D:\Cursor\luminus-puntoventa`. This repo owns the canonical schema; the POS repo carries a synced copy.

- **Source of truth:** `prisma/schema.prisma` in this repo. All schema changes start here.
- **Only this repo runs migrations.** POS never runs `prisma db push`, `prisma migrate dev`, or `prisma migrate deploy`. Its `railway.toml` `startCommand` is just `npm start` — it must NEVER touch the schema.
- **POS sync flow:** in POS, `npm run sync:schema` copies `../luminus/prisma/schema.prisma` into the POS repo. `npm run verify:schema` fails the build if the two files drift. POS hooks `predev` (sync) and `prebuild` (verify) enforce this.
- **Workflow for schema changes:**
  1. Edit `prisma/schema.prisma` here, run `npx prisma migrate dev --name <descriptor>`, commit, push.
  2. In POS repo: `npm run sync:schema`, commit the updated `prisma/schema.prisma`, push.
  3. Railway deploys ecommerce first (runs `prisma migrate deploy`); then POS deploys and only regenerates client.
- **Never** run `prisma db push` from either project against this DB — it will drop tables from the other (this already happened once; data was recoverable only because Railway had a copy).

### Workflow for schema changes (add/modify/drop a table)

Follow these steps in order. Steps 1–3 always run in `D:\Cursor\luminus`; steps 4–5 in `D:\Cursor\luminus-puntoventa`.

1. **Edit canonical schema** — `D:\Cursor\luminus\prisma\schema.prisma`. Validate: `npx prisma validate`.
2. **Create + apply migration** — `npx prisma migrate dev --name <descriptor>`. This generates `prisma/migrations/<ts>_<descriptor>/migration.sql`, applies it to the local DB, and regenerates the client. Use `--create-only` first if you want to review the SQL (e.g. for renames, NOT NULL backfills) before applying.
3. **Verify ecommerce** — `npm run build` to catch type errors.
4. **Sync POS** — `cd D:\Cursor\luminus-puntoventa && npm run sync:schema && npx prisma generate`. (Done automatically by POS `predev`/`prebuild` hooks too.)
5. **Implement the feature** — in whichever repo uses the new table/column. Import the model from `@/app/generated/prisma/client` as usual.
6. **Commit + push, ecommerce FIRST then POS.** Order matters on Railway: ecommerce deploy runs `prisma migrate deploy` (creates the table); POS deploy only regenerates client. Pushing POS first means its app starts querying a table that doesn't exist yet until the ecommerce deploy completes.

**Special cases:**
- *Rename column:* edit the generated SQL to use `ALTER TABLE ... RENAME COLUMN ...` — Prisma's default is drop+add (loses data).
- *Add NOT NULL column without default:* Prisma will prompt; either add a `@default()` in the schema, or edit migration SQL to backfill before adding the NOT NULL constraint.
- *Drop a table:* back up first (`pg_dump -t "TableName" ...`); migration will include `DROP TABLE`.
- *Table only used by POS:* still goes in the canonical schema. Ecommerce simply doesn't import it.

**Things that will break the contract — do not do these:**
- Edit `D:\Cursor\luminus-puntoventa\prisma\schema.prisma` directly (gets overwritten by `sync:schema`; `verify:schema` will fail the POS build).
- Run `npx prisma migrate dev`, `prisma migrate deploy`, or `prisma db push` from the POS project.
- Push POS commits with schema changes before pushing the corresponding ecommerce migration.
- Add `prisma migrate` or `db push` back to POS `railway.toml` `startCommand`.

## Critical: Prisma 7

This project uses **Prisma 7**, which has breaking changes vs Prisma 5:

- **Driver adapter required.** Never instantiate `new PrismaClient()` without the adapter:
  ```typescript
  import { PrismaPg } from "@prisma/adapter-pg";
  import { PrismaClient } from "@/app/generated/prisma/client";
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  ```
- **Generated client path:** `app/generated/prisma/` — import from `@/app/generated/prisma/client` (not `@prisma/client`)
- **Config file:** `prisma.config.ts` at root (not inside `prisma/`), holds datasource URL and seed command
- **Seed runner:** `tsx prisma/seed.ts` (not `ts-node`). Prisma 7 generates ESM-incompatible with ts-node CommonJS mode.
- **Schema:** `generator client { provider = "prisma-client" }` (not `"prisma-client-js"`)

## Critical: Zod 4

Zod 4 (v4.x) renames `.errors` → `.issues`:
```typescript
// ✓ Correct
error.issues[0].message

// ✗ Wrong (Zod 3)
error.errors[0].message
```

## Critical: Tailwind 4

No `tailwind.config.ts`. Custom theme configured via `@theme {}` block in `app/globals.css`. Custom colors: `primary` (#1a1a2e), `accent` (#c9a84c), `surface` (#f8f7f4).

## Auth

NextAuth 4 with JWT strategy. `lib/auth.ts` adds `id` and `role` to JWT token and session. Types augmented in `types/next-auth.d.ts`. Admin credential: `admin@luminus.pe / Admin123!`.

## Payment Flow (Mercado Pago)

Checkout API (no redirect) with `@mercadopago/sdk-react` CardPayment Brick:
1. `POST /api/payments/create-order` → creates Order PENDING in DB, returns `{ orderId, total }`
2. CardPayment Brick tokenizes card
3. `POST /api/payments/process` → calls `paymentClient.create()`, then `aprobarOrden()` if approved, returns result inline
4. Result shown inline on `/checkout` page (no redirect to success/failure pages)

Pages `checkout/success`, `checkout/failure`, `checkout/pending` exist only for external deep links (e.g., from confirmation emails).

**Testing without Mercado Pago:** in `npm run dev` the checkout shows a third payment tab, "Dev" (`components/checkout/DevBypassForm.tsx`), which approves the order without charging. It posts `{ orderId, devBypass: true }` to `payments/process` and goes through `aprobarOrden()` like any real payment — deducting stock and issuing the POS receipt — so it exercises the whole flow. The tab is gated on `NODE_ENV`, which Next inlines: it is dead-code-eliminated from production bundles, and `payments/process` re-checks `NODE_ENV === "development"` server-side regardless. It does not send the confirmation email.

## Critical: stock deduction happens only on payment approval

**Never write a new path that sets `paymentStatus = APPROVED` with a raw `prisma.order.update`.** Every approval must go through `aprobarOrden()` in `lib/fulfillment.ts` — dev bypass, `payments/process`, `payments/webhook` and the admin `PUT /api/orders/[id]` all do. A raw update would leave stock untouched and emit no receipt, silently desyncing the DB from the POS.

**Availability = `stockAlmacen + stockTienda`.** Use `stockDisponible()` from `lib/stock.ts`, never `stockAlmacen` alone — a product stocked only at the store is sellable online.

What `aprobarOrden()` does, all inside one transaction:

1. **Idempotency by CAS** — a single `updateMany` on `where: { id, stockDeducted: false }` decides who processes the order. Mercado Pago retries webhooks by design; the `count === 0` branch is the "already processed" path. Don't replace it with a read-then-write check.
2. **Locks products** with `SELECT … FOR UPDATE` ordered by id (avoids deadlocks, serializes against POS sales, which update the same rows without an explicit lock).
3. **Deducts in cascade** — warehouse first, store only for the remainder (`planDeduccion()`), never below 0. Also decrements the legacy `stock` total that the POS maintains. Writes a `VENTA_WEB` `StockMovimiento` and stores the per-line split in `OrderItem.qtyFromAlmacen` / `qtyFromTienda`.
4. **Emits an internal receipt** for the POS: `NOTA_VENTA` on its own serie `NV002` (so the `FOR UPDATE` on the correlativo doesn't contend with the counter's `NV001`), `channel: "WEB"`, `location: "WEB"`, cashier `web@luminus.pe`. Both the serie and the cashier are upserted on demand — no seeding needed in production.
5. **Attaches to the open cash session** if there is one, as an electronic payment (`TARJETA`, or `YAPE` when MP reports it). Never as cash: `luminus-puntoventa/lib/cash-flow.ts` only counts `EFECTIVO`/`MIXTO` at `TIENDA`/`ALMACEN`, so a web sale can't skew the physical cash count.

Overselling (stock sold in-store while the customer paid) never rejects a charged payment: it deducts what's left and records the shortfall in `Order.stockIssue`, shown as a banner in `/admin/pedidos/[id]`.

`revertirOrden()` is the mirror image, used when an order goes to `CANCELLED`/`REFUNDED`: returns stock to the exact locations it came from using the per-line snapshot, voids the receipt, and reverses the session totals — also CAS-guarded.

Web sales are voided **only** from the ecommerce admin. `DELETE /api/ventas/[id]` in the POS returns 422 for `channel === "WEB"`, because its reversal doesn't know the per-origin split and would return everything to the store.

Emails and push notifications stay **outside** the transaction — they do network I/O and the pool in `lib/prisma.ts` is only 5 connections.

## Currency & Locale

Peru. Currency: PEN (Soles). Use `formatPEN()` from `lib/utils.ts`. `formatARS` is a deprecated alias. Locale `es-PE`.

## Images

- Remote patterns: `res.cloudinary.com` and `images.unsplash.com` (configured in `next.config.ts`)
- Seed data uses Unsplash URLs for product images
- Production uploads use Cloudinary (`CldUploadWidget` unsigned preset `luminus-products`)

## Railway Deployment

See `railway.toml`. **Critical:** `prisma migrate deploy` runs in `startCommand`, NOT in `buildCommand`. The internal Railway Postgres network (`postgres.railway.internal`) is unavailable during the build phase.

```toml
[build]
buildCommand = "npm ci && npx prisma generate && npm run build"

[deploy]
startCommand = "npx prisma migrate deploy && npm start"
```

Required environment variables: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `MP_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY`, `NEXT_PUBLIC_APP_URL`. See `.env.example` for the full list.

## Hydration Notes

`<body>` has `suppressHydrationWarning` to handle browser extension attribute injection (e.g., `cz-shortcut-listen`). Do not remove it.

`app/auth/login/page.tsx` wraps `LoginForm` in `<Suspense>` because `useSearchParams()` requires a Suspense boundary in Next.js App Router.
