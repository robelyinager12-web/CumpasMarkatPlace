# Deployment

## How the pieces fit
- **Web** (`apps/web`) on Vercel. The browser only talks to the website's own domain; Next.js forwards `/api/v1/*` to the API,
  so login cookies are first-party and work in every browser, including Safari.
- **API** (`apps/api`) on a Docker host (Render blueprint included, or Railway/Fly). It applies database migrations on start.
- **Database:** managed PostgreSQL (Neon, Render, Supabase, Railway). Check the provider's free-tier limits: some free databases pause or expire.
- **Photos:** Cloudinary. **Email:** Resend (or another provider; the code in `email.service.ts` uses Resend's HTTP API).

## Steps
1. **Database:** create a PostgreSQL database and copy its connection string.
2. **API:** deploy with `render.yaml` (or the Dockerfile) and set the variables below. Health check: `/api/v1/health`.
3. **Web (Vercel):** import the repo, Root Directory `apps/web`. Set `NEXT_PUBLIC_API_URL=/api/v1`,
   `API_INTERNAL_URL=https://YOUR-API-HOST/api/v1`, and `NEXT_PUBLIC_CONTACT_EMAIL`.
4. Set the API's `FRONTEND_URL` to your final web address (your custom domain) and redeploy the API.
5. Add your custom domain on Vercel (HTTPS is automatic).
6. **First administrator:** register on the live site, then from the API host's shell run
   `pnpm --filter @unikamp/api create-admin you@yourdomain.com`. Log in, open **Dashboard, Security** and turn on two-factor
   (the admin area stays closed until you do). Save the recovery codes.
7. **Reference data:** the migrations create empty tables. Add your university and campuses in **Admin, Universities**, and the
   categories in **Admin, Categories**, or run the seed once with `NODE_ENV=production` (reference data only, no demo listings).

## Environment variables
**API**
| Variable | Notes |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `FRONTEND_URL` | The public web address, for CORS and email links |
| `SESSION_SECRET` | 32+ random characters, unique per environment. Rotating it signs everyone out and breaks stored two-factor secrets |
| `IMAGE_STORAGE_DRIVER` | `cloudinary` (required in production) |
| `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |
| `EMAIL_API_KEY`, `EMAIL_FROM` | Email provider key and a sender on a verified domain |
| `REQUIRE_ADMIN_2FA` | Default `true` in production |
| `ENABLE_API_DOCS` | Default `false` in production |
| `BCRYPT_COST`, `AUTH_RATE_LIMIT_MAX`, `LOGIN_MAX_FAILURES`, `LOGIN_LOCK_MINUTES` | Optional tuning (defaults 12, 50, 5, 15) |

**Web**
| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | `/api/v1` in production |
| `API_INTERNAL_URL` | The API's full address, ending in `/api/v1` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Shown on Contact, Terms and Privacy |

## Verify the deployment
1. `https://API-HOST/api/v1/health/ready` answers `ready`.
2. The home page loads, with no browser console errors.
3. Register with a real email: the verification email arrives, and the link works.
4. Create a listing with a photo, and find it in the marketplace. The photo comes from Cloudinary.
5. Log in with a second account in another browser: message the seller, and report a listing.
6. As administrator (with two-factor): resolve the report, then look at the audit log.
7. Make sure `https://API-HOST/api/v1/docs` is not public, unless you meant it to be.

## Backups
- Turn on the provider's automated backups and note how long they are kept.
- Also take your own copy before risky changes: `pg_dump "$DATABASE_URL" -Fc -f unikamp-$(date +%F).dump`.
- Test a restore on a scratch database: `pg_restore --clean --no-owner -d "$SCRATCH_DATABASE_URL" unikamp-DATE.dump`.
- Cloudinary keeps the photos; deleting a listing deletes its photos.

## Updating
Push to `main`. CI must pass. Vercel and the API host redeploy; migrations run on start. For a risky migration, take a backup first.

## Troubleshooting
| Symptom | Likely cause and fix |
|---|---|
| API exits with `Invalid environment variables` | The message names the variable. `SESSION_SECRET` must be 32+ characters; production needs `IMAGE_STORAGE_DRIVER=cloudinary` with `CLOUDINARY_URL` |
| Login works on the API but the site says you are signed out | The browser is calling the API on another domain. In production use `NEXT_PUBLIC_API_URL=/api/v1` and set `API_INTERNAL_URL` |
| Requests fail with a CORS or "origin not allowed" error | `FRONTEND_URL` on the API must exactly match the web address (including `https` and no trailing path) |
| Vercel preview deployments cannot log in | Writes are only accepted from `FRONTEND_URL`. Test on the real domain, or add the preview address deliberately |
| `Prisma schema validation` or migration errors on start | Check `DATABASE_URL`; run `pnpm --filter @unikamp/api prisma:deploy` by hand and read the message |
| `TypeScript 7 is not supported` | Keep `typescript@5` in both apps until you upgrade Next.js |
| Photos do not show | In production, check `CLOUDINARY_URL`; locally, `PUBLIC_API_URL` must match the API address |
| No emails | Without `EMAIL_API_KEY` the API only logs a warning. Check the key, the sender domain and the API logs |
| An administrator lost their phone and recovery codes | `pnpm --filter @unikamp/api reset-2fa their@email`; they set it up again |
| "Too many failed attempts" for a real person | Wait 15 minutes, or delete their row in `LoginThrottle` |
| `docker: command not found` | Install Docker Desktop, or point `DATABASE_URL` at any PostgreSQL you already run |