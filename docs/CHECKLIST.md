# Checklist

## Built
- [x] Phase 1 Foundation (monorepo, API, database, CI)
- [x] Phase 2 Accounts and verification
- [x] Phase 3 Marketplace (listings, photos, search, favorites)
- [x] Phase 4 Messaging, safety and dashboards
- [x] Phase 5 Administration
- [x] Phase 6 Testing and hardening

## Before the pilot launch
- [ ] A lawyer reviewed the Terms and Privacy Policy; fill the bracketed gaps; set `LEGAL_REVIEWED = true` in `apps/web/src/lib/legal.ts`
- [ ] Set `NEXT_PUBLIC_CONTACT_EMAIL` and make sure someone reads that inbox
- [ ] Email provider account, sending domain verified, `EMAIL_API_KEY` and `EMAIL_FROM` set; test all three emails in a real inbox
- [ ] Cloudinary account and `CLOUDINARY_URL`; upload a photo on the live site
- [ ] The pilot university and its real campuses are in the database (edit `PILOT_UNIVERSITY` in `apps/api/prisma/seed.ts`, or use the admin screens); the demo listings are not in production
- [ ] First administrator created, two-factor on, recovery codes stored safely; a second administrator exists
- [ ] Automated database backups on, and a restore tested
- [ ] An uptime check on `/api/v1/health` with an alert to someone
- [ ] Manual checks in `docs/TESTING.md` done (slow network, phones, keyboard, Amharic)
- [ ] A plan for who moderates reports and how fast (for example within 24 hours), and who approves student verification
- [ ] A short guide or message for the first students

## Known limitations
- Messages arrive within seconds, not instantly (no WebSocket server)
- Phone numbers are not verified; no SMS provider
- No payments, featured-listing purchase, subscriptions or commissions: those need a supported Ethiopian payment provider, server-side payment verification and a legal check
- Search is simple word matching (no spelling tolerance or relevance ranking)
- Photos cannot be reordered; messages cannot be edited or deleted; no attachments
- Account deletion and data export are handled by email for now
- The audit log is not tamper-proof against direct database access
- Featured listings only appear in the home page row