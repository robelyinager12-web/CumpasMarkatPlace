# API

Interactive documentation: `http://localhost:4000/api/v1/docs` (OpenAPI file at `/api/v1/docs/openapi.json`).
In production the documentation is off unless you set `ENABLE_API_DOCS=true`.

- Base path `/api/v1`. Everything is JSON.
- Success: `{ "success": true, "data": { ... }, "meta": { "page", "pageSize", "total", "totalPages" } }` (`meta` only on lists).
- Failure: `{ "success": false, "error": { "code", "message", "details"? } }`.
- Sign in with `POST /auth/login`. The session is an HttpOnly cookie named `unikamp_session`. If the account has two-factor, the first
  response is `{ "twoFactorRequired": true }` and you send the same request again with `code`.
- Writes from another website are refused (Origin check). Use the web app or a tool such as curl.

## Common error codes
| Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Bad input; `details` lists each field |
| 401 | `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `INVALID_CODE` | Not signed in, wrong password, wrong two-factor code |
| 403 | `FORBIDDEN`, `EMAIL_NOT_VERIFIED`, `ACCOUNT_SUSPENDED`, `TWO_FACTOR_REQUIRED`, `LISTING_REMOVED` | Not allowed |
| 404 | `NOT_FOUND` | Missing, or hidden from you |
| 409 | `CONFLICT` | Duplicate or not allowed in the current state |
| 429 | `TOO_MANY_REQUESTS`, `TOO_MANY_ATTEMPTS` | Slow down, or the account is temporarily locked |