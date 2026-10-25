# Deployment
1. **Database:** managed PostgreSQL (Render, Neon, Supabase or Railway). Copy its connection string.
2. **API:** deploy `apps/api` (Render blueprint `render.yaml`, or Railway/Fly with `apps/api/
   **Photos:** create a free Cloudinary account, copy the "API environment variable" from its dashboard
   (looks like `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`) and set it as `CLOUDINARY_URL` on the API host,
   together with `IMAGE_STORAGE_DRIVER=cloudinary`. The API refuses to start in production without them.
Dockerfile`).
   Set `DATABASE_URL`, `SESSION_SECRET`, `FRONTEND_URL`. Migrations run on start (`start:prod`).
3. **Web:** import repo in Vercel, Root Directory `apps/web`, set `NEXT_PUBLIC_API_URL=https://<api-host>/api/v1`.
4. Set API `FRONTEND_URL` to the Vercel URL (CORS), then redeploy the API.
5. Verify `GET /api/v1/health` and run through the critical user flows.
6. Enable automated database backups at your DB provider.
## Messaging and email

- Chat updates by polling (thread every 4 s, list every 10 s, badges every 30 s). No WebSocket server is needed,
  which is why it works through the Vercel proxy.
- New-message emails need `EMAIL_API_KEY` and a sender (`EMAIL_FROM`) on a domain you have verified with your email provider.
  Without a key, production logs a warning and sends nothing.
- The first administrator is created with `pnpm --filter @unikamp/api create-admin <email>`; until the Phase 5 screens
  exist, moderation uses the `/api/v1/admin/reports` endpoints.
