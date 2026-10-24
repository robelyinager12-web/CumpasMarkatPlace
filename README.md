# UniKamp - Your Campus. Your Marketplace.

Student marketplace for Ethiopian universities (currency: ETB).

## Structure
- `apps/web`  Next.js frontend (deploy: Vercel)
- `apps/api`  Express + Prisma API (deploy: Render / Railway / Fly)
- `packages/shared`  shared types + Zod schemas
- `docs/`  architecture, API, deployment, security, checklist

## Local setup
```bash
pnpm install
cp .env.example apps/api/.env      # edit values
cp apps/web/.env.example apps/web/.env.local
pnpm db:up && pnpm db:migrate && pnpm db:seed
pnpm dev                           # web :3000, api :4000
```
See `docs/DEPLOYMENT.md` for production.
# CumpasMarkatPlace
