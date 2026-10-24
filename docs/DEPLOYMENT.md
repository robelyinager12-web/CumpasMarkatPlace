# Deployment
1. **Database:** managed PostgreSQL (Render, Neon, Supabase or Railway). Copy its connection string.
2. **API:** deploy `apps/api` (Render blueprint `render.yaml`, or Railway/Fly with `apps/api/Dockerfile`).
   Set `DATABASE_URL`, `SESSION_SECRET`, `FRONTEND_URL`. Migrations run on start (`start:prod`).
3. **Web:** import repo in Vercel, Root Directory `apps/web`, set `NEXT_PUBLIC_API_URL=https://<api-host>/api/v1`.
4. Set API `FRONTEND_URL` to the Vercel URL (CORS), then redeploy the API.
5. Verify `GET /api/v1/health` and run through the critical user flows.
6. Enable automated database backups at your DB provider.
