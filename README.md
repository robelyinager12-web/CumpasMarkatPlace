# UniKamp: Your Campus. Your Marketplace.

A marketplace where students buy and sell affordable things (textbooks, laptops, clothes, dormitory items and more)
within their own campus community. Prices are in Ethiopian Birr (ETB). UniKamp does not take or hold payments: buyers
and sellers meet on campus.

## What is built
- Accounts with email verification, password reset, sign-in lockout and optional two-factor sign-in
  (required for administrators in production)
- Admin-approved student verification (the badge only shows after a real approval)
- Listings with photos, search, filters, sorting, favorites, seller and buyer dashboards
- Buyer-to-seller messaging (checked every few seconds), blocking, reporting and notifications
- Admin area: statistics, users, listing and report moderation, student verification, categories, universities and
  campuses, featured listings, audit log
- Documented API (Swagger UI), automated tests and end-to-end tests

## Structure
- `apps/web`: Next.js frontend (deploys to Vercel)
- `apps/api`: Express + Prisma + PostgreSQL API (deploys with Docker)
- `packages/shared`: shared constants
- `docs/`: deployment, security, testing, API and the launch checklist

## Run it locally
Requirements: Node 22, pnpm 10, PostgreSQL 16 (Docker makes this easy).

```bash
pnpm install
cp apps/api/.env.example apps/api/.env      # then edit: DATABASE_URL, SESSION_SECRET (32+ random characters)
cp apps/web/.env.example apps/web/.env.local
docker compose up -d db                      # or use your own PostgreSQL
pnpm --filter @unikamp/api prisma:generate
pnpm db:migrate
pnpm db:seed                                 # universities, categories, flagged demo listings
pnpm dev                                     # web http://localhost:3000, API http://localhost:4000
```
Use `localhost`, not `127.0.0.1`. Verification and reset links are printed in the API terminal until you configure email.
API documentation: http://localhost:4000/api/v1/docs

Make yourself an administrator: register on the site, then
`pnpm --filter @unikamp/api create-admin you@example.com`.

## Useful commands
| Command | What it does |
|---|---|
| `pnpm dev` | Run web and API |
| `pnpm typecheck && pnpm lint && pnpm test && pnpm build` | The full local check |
| `pnpm e2e` | Browser tests with their own database and ports (first time: `pnpm --filter @unikamp/web exec playwright install chromium`) |
| `pnpm db:studio` | Browse the database |
| `pnpm --filter @unikamp/api create-admin <email>` | Promote an account to administrator |
| `pnpm --filter @unikamp/api reset-2fa <email>` | Reset two-factor for someone locked out |

## Deploying and launching
See `docs/DEPLOYMENT.md` and the pre-launch list in `docs/CHECKLIST.md`.
The Terms and Privacy Policy are drafts until a lawyer has reviewed them (`apps/web/src/lib/legal.ts`).