# Testing

## Automated
| Command | What it covers |
|---|---|
| `pnpm --filter @unikamp/api test` | Unit and integration tests against a real PostgreSQL test database (`unikamp_test`): validation, auth, lockout, two-factor, listings, search, favorites, messaging, reports, admin, audit log, cleanup, API docs. Includes security tests: ownership, conversation privacy, admin access on every admin route, impersonation, mass assignment, cross-site writes, rate limits. |
| `pnpm --filter @unikamp/web test` | Small utility tests (currency, dates, filters, image URLs) |
| `pnpm e2e` | Real browser (Chromium) against a built site and its own database `unikamp_e2e` on ports 3100 and 4100: register, log in and out, create and publish a listing with a photo, search and filters, favorites, chat between two people, block, report, moderation, suspension, two-factor, lockout, accessibility scan |

The API tests need the test database to exist and be migrated:
`docker compose exec db psql -U unikamp -d postgres -c "CREATE DATABASE unikamp_test;"` once,
then `pnpm --filter @unikamp/api test:migrate`. The end-to-end database is created automatically.

Everything runs on every push in GitHub Actions (`.github/workflows/ci.yml`). A failed end-to-end run uploads its report.

## Manual checks before a launch
Automated tests do not replace these.
1. **Slow connection.** Chrome DevTools, Network tab, "Slow 4G" plus "Disable cache". Open the home page, marketplace and a
   listing. Pages should become usable within a few seconds, and a 3 MB phone photo should upload (it is shrunk first).
2. **Phones.** Open the site at 360 px wide (DevTools device mode) and on a real phone. Check the filters, forms, the chat
   and the admin tables (they scroll sideways).
3. **Keyboard only.** Tab through the home page, login, a listing and the report dialog. Focus must always be visible,
   and Escape closes dialogs.
4. **Screen reader.** Try NVDA (Windows) or VoiceOver on one flow: log in, search, open a listing.
5. **Amharic.** Type Amharic in the title, description and chat. Check it saves, displays and searches correctly,
   and that Enter does not send while the keyboard is still composing a character.
6. **Two-factor with a real authenticator app.** Set up, log out, log in with a code, log in with a recovery code.
7. **Real email.** After configuring the email provider, register with a real address and check the verification email,
   reset email and new-message email arrive, and are not in spam.
8. **Production smoke test.** After deploying, run through the flow in `docs/DEPLOYMENT.md` ("Verify the deployment").