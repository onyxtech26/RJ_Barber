# Changelog — rj-barber-salon

Append-only, dated log of significant completed work. Newest entries on top.
Format each entry: what was done, why it mattered, and any key decisions.

---

## 2026-10-01
### Phase 3 — Staff PIN login, sessions and roles
- **Login screen:** pick your name, enter a 4–6 digit PIN on a touch keypad (physical keyboard works too: digits, Backspace, Enter, Esc). Errors show tries left.
- **Sessions in the database** (`sessions` table, migration `0001`): a random 32-byte token goes in an httpOnly, SameSite=Lax cookie; only its SHA-256 hash is stored, so a copied DB file can't be used to sign in. 12-hour lifetime; `last_seen_at` refreshed at most every 5 min; expired rows cleaned up on each login.
- **Where checks happen (per the Next 16 auth guide):** `src/proxy.ts` only redirects when there's no cookie at all (fast, optimistic). The real check is `requireStaff()` / `requireOwner()` in `src/server/auth/session.ts`, called by every page and data function and cached per request with React `cache()`. Not relying on the layout, because layouts don't re-run on client navigation.
- **Roles:** owners get Day Close and Settings; staff are redirected to the Terminal if they open those URLs, and the links are hidden for them. "Switch" button signs out for the next person.
- **Lockout:** 5 wrong PINs lock that staff member for 5 minutes (counter incremented atomically in SQL). Login, logout, failed PINs and lockouts are written to `audit_log`.
- **Decision — database sessions over signed JWT cookies:** lets us revoke instantly (sign out, deactivate staff, PIN change) and needs no secret key to manage; on local SQLite the extra lookup costs microseconds.
- **Verified in the browser:** no-cookie redirect, wrong PIN message, staff login + hidden owner links, staff blocked from `/settings` and `/close`, `/login` redirects when signed in, Switch deletes the session row, revoking sessions in the DB signs the browser out on the next request (no redirect loop), lockout on the 5th wrong PIN and correct PIN refused while locked, audit trail complete.

### Phase 2 — SQLite data layer
- **Schema** (`src/server/db/schema.ts`): shop_settings (single row), staff (owner/staff, hashed PIN, barber flag, commission), categories, catalog_items (services + products), orders (pay-then-confirm status, DuitNow/cash, discount, SST, who confirmed/cancelled/voided), order_items (price/commission snapshots), receipt_counters, day_closes, audit_log.
- **Integrity in the database itself:** CHECK constraints for every enum, non-negative money, discount ≤ subtotal, rates 0–100%, single settings row; unique receipt numbers; foreign keys. Verified each rejects bad data.
- **Scripts:** `db:generate`, `db:migrate` (versioned SQL migrations, sets WAL), `db:seed` (idempotent; `db:reset` wipes in dev), `db:backup` (`VACUUM INTO` one copy per day, keeps 30), `db:setup`. `run.bat` runs setup + backup before starting.
- **Helpers:** `lib/money.ts` (sen ↔ RM, basis-point maths), `lib/business-date.ts` (Malaysia-time trading day), `server/auth/pin.ts` (scrypt PIN hashing, constant-time verify).
- Terminal page now renders the live catalog from the DB (read-only).
- **Decision — `@libsql/client` instead of `better-sqlite3`:** better-sqlite3 13.0.3 has no prebuilt binary for Node 24 on Windows and falls back to compiling with Visual Studio, which the shop PC won't have. libsql ships prebuilt platform packages, needs no install-script approval, and keeps a path to hosted (Turso) later.
- **Decision — migrations, not `db:push`:** versioned SQL files apply the same way on every machine and never silently drop columns holding real sales data.
- **Bug fixed — fresh install crashed:** symptom: `ConnectionFailed … 14` (SQLITE_CANTOPEN) on first `db:setup`. Cause: the DB client opens the file at import time, before the migrate script created `data/`; SQLite creates files but not folders. Fix: `client.ts` creates the parent folder itself. Lesson: test setup from an empty `data/` folder, not just on a dev machine that already has it.
- **Gotcha:** SQLite doesn't enforce Drizzle `enum` lists — only CHECK constraints do. Next 16 prerenders pages at build time unless a data function calls `connection()` (or reads cookies/headers).

### Phase 1 — Strip down to a POS-only shell with a light theme
- Removed the public site, booking wizard, `/manage`, WhatsApp webhook/bot/reminders, slot scheduling, Redis locking, Supabase auth/clients, queue, calendar, customers, dashboard, till/petty cash, the old Postgres schema and all mock API routes.
- Uninstalled `@supabase/*`, `@upstash/*`, `postgres`, `react-day-picker`, `cmdk`, `next-themes`, `@tanstack/react-query`, `clsx`, `tailwind-merge`; removed the duplicate base-ui toast and the calendar/command components.
- New light theme from the logo (off-white, black ink, yellow `#F5C400`); added `brand` button variant and `xl` touch size; logo used as app icon, in the top bar and on login.
- New shell: `(pos)` route group with top bar (Terminal / Orders / Day Close / Settings) plus `/login`, all placeholders for later phases.
- **Why:** client only needs the POS for now; ~60% of the code was out of scope, and none of it was wired to a real database (all mocks), so rebuilding on a clean base is cheaper than adapting it.
- **Verified:** `tsc`, `eslint` and `next build` clean; all routes return 200 with no console errors and no horizontal overflow at 375px and 1280px.

### Phase 0 — Redesign kickoff & architecture decisions
- Tagged the previous booking/WhatsApp system as `pre-pos-redesign` (local tag).
- Read the Next 16 docs: `middleware.ts` is now `proxy.ts` and should only do optimistic redirects.
- **Decisions:** POS-only scope; payments are DuitNow QR + cash with a staff "payment received" confirmation step (no drawer/float); money in integer sen, recomputed on the server; SQLite via Drizzle on the shop PC (no Supabase); staff PIN auth with owner/staff roles; feature-based folders (`src/features/*`).
- Found and noted problems in the old system: POS sales never saved, PINs hardcoded in the browser, auth skipped when Supabase was unset, server trusted client totals.

### Set up project tracking
- Scaffolded CLAUDE.md section, PROJECT_STATUS.md, and this changelog so sessions have continuity and big tasks get documented.
- **Why:** so work is never lost between sessions and completed milestones are remembered.
