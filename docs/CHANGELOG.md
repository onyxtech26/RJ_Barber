# Changelog — rj-barber-salon

Append-only, dated log of significant completed work. Newest entries on top.
Format each entry: what was done, why it mattered, and any key decisions.

---

## 2026-10-01
### Phase 4 — POS terminal
- **Terminal** (`src/features/pos/`): barber selector (defaults to the signed-in barber), searchable catalog grid with category chips, ticket with quantity +/−, barber per line (services must have one), optional customer name, discount (percent or RM, reason required, quick reasons), live subtotal/discount/SST/total, and two charge buttons: **DuitNow** and **Cash**.
- **Payment screen:** DuitNow shows the amount and the shop QR (placeholder until uploaded in Settings) with an optional reference; Cash takes amount received with quick-note buttons and shows change (blocks if not enough). Both have *Switch method*, *Cancel sale* (two-step) and *Leave pending*.
- **Pending tray:** every charged-but-unconfirmed sale (any day, older ones flagged red) — tap to resume. Survives page reloads because it lives in the DB.
- **Receipt dialog** after confirmation: lines with barber, discount, SST, cash/change, reference, who confirmed. (Printing comes in Phase 7.)
- **Server Actions** (`createOrder`, `confirmPayment`, `cancelPendingOrder`, `changePaymentMethod`): each re-checks the session, validates input with zod, and recomputes prices/commission/SST from the DB inside a transaction with per-day receipt numbering (`RJ-20261001-001`) and audit entries.
- **Decision — one pricing function for client and server** (`src/lib/pricing.ts`): the preview and the saved numbers can't drift, and the browser never sends prices. 12 unit tests (`npm test`, Node's built-in runner via tsx).
- **Decision — commission on the discounted amount:** the ticket discount is split across lines proportionally (exact to the sen); commission is paid on what was actually charged, so the shop doesn't pay commission on money it never received.
- **Decision — owner approval reuses the login lockout:** the PIN check + 5-try lockout moved to `src/server/auth/pin-attempt.ts` and is shared by sign-in and discount approval, so the approval box can't be used to brute-force the owner's PIN.
- **Schema:** migration `0002` adds `order_items.position` (UUID ids would otherwise scramble receipt line order). Enum lists moved to `src/lib/enums.ts` so client code doesn't pull Drizzle into the browser bundle.
- **Bug fixed — Charge buttons off-screen on a 1024×768 tablet:** symptom: with a few items the DuitNow/Cash buttons were pushed below the screen and the whole page scrolled. Cause: the terminal grid was a flex item with `flex-1`, and flex items default to `min-height: auto` (never shrink below content), which overrode its fixed height; plus the header was 65px (64 + 1px border). Fix: `lg:flex-none lg:grid-rows-1` on the grid and `h-16` on the header itself. Lesson: when a fixed-height panel must scroll internally, check every ancestor that is a flex/grid item for `min-height: auto`.
- **Accessibility:** catalog tiles and pending-tray entries got explicit labels ("Add Haircut, RM 25.00") — they were announced as plain "button".
- **Verified in the browser (as a staff member):** DuitNow sale with reference; cash sale with RM 50 → RM 20 change and not-enough-cash guard; leave pending → reload → resume → switch to cash → confirm; 50% discount → owner approval required → wrong PIN counts toward lockout → correct PIN approves; cancel sale; pending counter refreshes after each action; DB rows, commission (incl. discounted), approver and audit trail all correct; no console errors; no horizontal overflow at 375px; charge buttons visible at 1024×768 and 1366×768.
- **Not yet exercised live:** the duplicate-request path (same order id sent twice) and two devices confirming the same sale at once — both are handled in code (id lookup / conditional `WHERE status = 'awaiting_payment'` update) but weren't reproduced in the browser.

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
