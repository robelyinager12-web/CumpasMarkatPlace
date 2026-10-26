# Security

## What protects the service
- **Passwords:** bcrypt (cost 12 in production), minimum 8 characters with a letter and a number. Reset links are single-use and expire in 1 hour; a reset signs the person out everywhere.
- **Sessions:** a random token in an HttpOnly, SameSite=Lax cookie (Secure in production). Only a keyed hash is stored, so logout, suspension and password reset end sessions immediately.
- **Sign-in protection:** a per-IP rate limit plus a lockout after 5 failed attempts per email address (15 minutes). It behaves the same for emails that do not exist.
- **Two-factor (TOTP):** optional for everyone, required for administrators in production. Secrets are encrypted at rest (AES-256-GCM); recovery codes are stored as hashes and are single-use.
- **Authorization on the server:** every admin route requires a signed-in administrator (with two-factor, when enforced); owners only can change their listings and photos; only the two participants can read or write a conversation. Tests check all of this.
- **Input:** every request is validated with Zod; unknown fields are dropped (so a client cannot set `role`, `sellerId` and so on); Prisma prevents SQL injection; React escapes output.
- **Uploads:** JPEG, PNG and WebP only, detected from the file's real bytes (not the name), 5 MB each, 8 per listing, random file names, no execution.
- **Cross-site requests:** SameSite cookies plus an Origin check on every write.
- **Headers:** Helmet on the API; nosniff, frame-deny and referrer policy on the website.
- **Privacy by design:** public pages show "Abebe K." and never an email or phone number; message text is never in emails; logs redact secrets.
- **Accountability:** every administrator action is saved in the audit log in the same database transaction as the action itself.

## Known limits
- The audit log is an ordinary table. It prevents silent admin actions but is not tamper-proof against someone with direct database access.
- Phone numbers are not verified (no SMS provider).
- Messages are not scanned for spam or scams beyond rate limits. Moderators cannot read conversations.
- Rotating `SESSION_SECRET` signs everyone out and makes stored two-factor secrets unreadable.
- Per-IP limits are shared on campus Wi-Fi; that is why the lockout is per email address.
- There is no automated malware scan of uploaded images.

## Operations checklist
- Unique, random `SESSION_SECRET` (32+ characters) per environment; never reuse the local one.
- Few administrator accounts, each with a strong unique password and two-factor on.
- Keep dependencies updated (`pnpm outdated`, and enable GitHub Dependabot).
- Automated database backups on, and a restore tested at least once.
- Know how to react: suspend the account, remove the listing, check the audit log, reset two-factor with `reset-2fa`.
- Give users a way to report vulnerabilities (the contact email) and answer quickly.