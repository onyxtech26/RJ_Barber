# Project Status — rj-barber-salon

> **Living board.** Read at the start of every session; updated when significant tasks finish. Newest state on top.

**Last updated:** 2026-10-01

---

## 📍 Where I left off
**All 7 phases of the POS redesign are done**, plus a **staff booking book** (Phase 8: calendar per barber, durations, working hours, double-booking guard, Start sale → POS). `rj-barber.vercel.app` is a self-resetting **demo**. Next: push Phase 8 to the demo, show the barber, then the go-live checklist below.

---

## 🗂️ Board

### ✅ Done
- [x] Set up cross-session project tracking (this system)
- [x] Phase 0 — tagged old system `pre-pos-redesign`, read Next 16 docs (middleware → `proxy.ts`)
- [x] Phase 1 — removed booking/WhatsApp/queue/till/Supabase/Redis; light theme from logo; POS shell + placeholder routes
- [x] Phase 8 — Bookings (staff-only): `bookings` + `booking_items` tables (migration 0006), service durations, per-barber weekly hours, day calendar with per-barber columns, create/reschedule/check-in/no-show/cancel, overlap check inside the write transaction, outside-hours override, Start sale prefills the Terminal and links the sale (paid → booking completed, cancelled sale → booking released), Day Close booking stats, demo sample bookings, 12 scheduling unit tests
- [x] Phase 7 — 80mm receipt print view + A4 day report (`/print/...`, printed via hidden iframe, Print buttons on receipt dialog / sale detail / Day Close); session cookie `secure` only over real HTTPS; production `run.bat` (build only when source changed via `scripts/needs-build.mjs`, `next start` bound to 127.0.0.1, opens Edge app window); `.gitattributes` keeps `.bat` CRLF; README rewritten for owner/staff/maintainer
- [x] Phase 6 — Day Close (DuitNow vs cash, discounts/SST, per-barber net sales + commission, products sold; blocked while sales are pending; freezes snapshot, links orders, blocks new sales and voids for that date, backup on close; owner reopen with reason; unclosed-days reminder) + Settings (shop details, SST with reg no., discount approval limit, DuitNow account name + QR upload served at `/duitnow-qr`; catalog editor with hide-not-delete; staff add/edit/deactivate, last-owner guard, PIN reset that clears lockout and revokes sessions)
- [x] Phase 5 — Orders: URL-based filters (date, status, method, search), day summary (takings / DuitNow / cash / not counted), sale detail with history timeline, owner-only commission view, owner void (paid only, reason required, blocked once the day is closed), audit `order.voided`
- [x] Phase 4 — POS terminal: catalog grid + search, ticket with barber per line, discounts (owner PIN above threshold, shared lockout), server-side pricing/commission/SST, receipt numbers, DuitNow/cash payment screen with change calculator, pending tray, cancel, switch method, receipt dialog; pricing unit tests (`npm test`)
- [x] Phase 3 — Staff PIN auth: DB-backed sessions (hashed token in httpOnly cookie, 12h), `proxy.ts` cookie-presence redirect, `requireStaff()`/`requireOwner()` DAL checks in pages/queries, owner-only nav, 5-try / 5-min lockout, audit log for login/logout/failures
- [x] Phase 2 — Drizzle on SQLite via `@libsql/client`: schema + CHECK constraints, migrations, seed (RM catalog, placeholder staff, generated PINs), daily backup, `run.bat` prepares DB on launch

### 🔄 In progress
- (nothing active)

### ⏭️ Next / To do
- [ ] Optional: delete the 14 stale empty env vars on the Vercel project (old Supabase/Upstash/WhatsApp/etc.). Optional: switch the demo to Turso if it must keep data between visits.
- [ ] Go-live: get the client's real staff names, services and prices, and DuitNow QR (they can enter them in Settings)
- [ ] Go-live: test-print on the actual 80mm printer (margins none, headers off); decide on `--kiosk-printing`
- [ ] Go-live: install on the shop PC from a clean copy (no `data/`), set real PINs, delete `data/initial-pins.txt`
- [ ] Go-live: agree how `data/` gets copied off the PC (USB / cloud folder) — backups on the same disk don't survive a disk failure

### 💤 Backlog / ideas
- Move from SQLite to hosted Postgres if the client wants cloud access later
- Stock counting for retail products

---

## 🧠 Key decisions & context
- **Scope:** POS only. Client doesn't need booking, WhatsApp, queue, calendar or dashboard for now. Old system kept at git tag `pre-pos-redesign`.
- **Payments:** only **DuitNow QR** and **cash**. No cash drawer / float / petty cash. Flow: Charge → AWAITING_PAYMENT → staff confirms → PAID (records who/when, optional DuitNow ref). Cash shows a change helper only.
- **Money:** integers in sen; server recomputes all totals from DB prices — never trust client totals. Order items snapshot name/price/barber/commission.
- **Extras in scope:** barber commission per line, retail products (no stock), discounts with reason, optional SST (off by default).
- **Hosting/DB:** no Supabase for now. SQLite file `data/rj-pos.db` on the shop PC (single counter device), app launched via `run.bat` (runs `db:setup` + `db:backup` first). Driver is `@libsql/client`, NOT `better-sqlite3` (no Node 24 Windows prebuilt → needs Visual Studio to compile).
- **DB conventions:** money in sen, rates in basis points (5000 = 50%), timestamps epoch ms, `business_date` = Malaysia-time 'YYYY-MM-DD'. Enums are enforced with SQL CHECK constraints (Drizzle enums are TS-only on SQLite). App code imports `@/server/db` (server-only); CLI scripts import `src/server/db/client.ts`. Data functions call `await connection()` so pages aren't prerendered with stale data.
- **Seed data is placeholder:** staff names (RJ / Barber 1 / Barber 2) and catalog prices are guesses — confirm real ones with the client. Initial PINs are in `data/initial-pins.txt` (gitignored).
- **Theme:** light only. Tokens in `src/app/globals.css`: `--primary` = black ink, `--brand` = logo yellow `#F5C400` used only as a fill with black text (Charge button, active nav).
- **Next 16:** `middleware.ts` is renamed `proxy.ts`; use it only for optimistic redirects — real auth checks live in server code.
- **Auth rules:** every page, query and Server Action calls `requireStaff()` or `requireOwner()` (`src/server/auth/session.ts`) — never rely on the layout or proxy alone. Owner-only: Day Close, Settings, voids. Changing a PIN or deactivating staff must call `revokeAllSessions(staffId)`. Session cookie `rj_session` is `secure` only in production (Chrome treats http://localhost as secure; accessing via LAN IP over http in production would drop it).
- **Pricing rules:** `src/lib/pricing.ts` is the single source of ticket maths (client preview + server). Commission is on the discounted line value (discount split proportionally, largest-remainder rounding), before SST. SST is charged on the discounted subtotal. Server recomputes everything; client only sends item ids, quantities, barber ids.
- **Order flow:** Charge creates the order as `awaiting_payment` with a receipt number (`RJ-YYYYMMDD-NNN`, per-day counter). Confirm/cancel/switch-method are conditional updates (`WHERE status = 'awaiting_payment'`), so double-confirm can't happen. The terminal generates the order UUID; a retry of the same ticket reuses it (idempotent), any ticket edit makes a new one.
- **Voids:** owner only, `paid` → `voided`, never after the day is closed (`orders.day_close_id` set). Phase 6's day close must set `day_close_id` on that day's orders so this guard engages. Voided/cancelled/pending sales are excluded from takings.
- **Day close:** `day_closes.totals` is a frozen `DayReport` (`src/features/close/report.ts`); closing links that day's orders via `day_close_id`, which blocks voids and (via a check inside `createOrder`'s transaction) new sales. Reopen deletes the close and unlinks orders; the old snapshot is kept in the audit log. Backups: `rj-pos-YYYY-MM-DD.db` at start-up, `rj-pos-close-YYYY-MM-DD.db` on each close (30 of each kept).
- **Uploads:** `data/uploads/` (never `public/`), type checked by magic bytes, max 4 MB (`experimental.serverActions.bodySizeLimit = 5mb`).
- **Migration gotcha:** drizzle-kit's SQLite table-rebuild migrations can SELECT a brand-new column from the old table (happened in `0003`) — always read generated SQL before applying.
- **Enums** live in `src/lib/enums.ts` (client-safe); `schema.ts` re-exports them.
- **Production run:** `run.bat` → `db:setup` → `db:backup` → build if `scripts/needs-build.mjs` says source is newer than `.next/BUILD_ID` → `next start -H 127.0.0.1 -p 3000` → Edge `--app` window. Not exposed on the LAN by default (README "Using a tablet" explains how to change it). Session cookie is `secure` only when `x-forwarded-proto` is https.
- **Printing:** `/print/receipt/[id]` (80mm, `@page size: 80mm auto`) and `/print/day/[date]` (A4, owner only). `src/lib/print.ts` loads them in a hidden iframe and checks for a `data-print-ready` marker before calling `print()`, so error/login pages are never printed.
- **Two deployments:** shop PC = local SQLite file via `run.bat` (the real POS); Vercel `rj-barber.vercel.app` = **self-resetting demo**: `vercel.json` runs `build:demo-db` (migrate + seed with `DEMO_PINS` + `demo-data.ts` samples → `demo/rj-pos-demo.db`), `outputFileTracingIncludes` bundles it, and `client.ts` copies it to `/tmp` on first use when `VERCEL=1` and no DB URL is set. `IS_DEMO` (`src/lib/demo.ts`) = `VERCEL=1` or `DEMO_MODE=1` → badge, PIN hints on sign-in, no close backups. Functions pinned to `sin1`. Turso (`TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN`) still supported for a persistent demo; the seed refuses a hosted DB without `SEED_*_PIN`. Empty env vars count as unset (`||`). **After any local `VERCEL=1` build, rebuild normally** so `run.bat` doesn't serve demo-baked static pages.
- **QR image** lives in `shop_settings.duitnow_qr_image` (blob) + `duitnow_qr_type` — no files on disk anywhere now. It's loaded via the `loadDuitnowQr` Server Action (data URL), **not** a route handler: on Vercel, route handlers are a separate function with their own demo DB copy and can't see sessions. Avoid adding route handlers that need DB/session state while the demo uses `/tmp`.
- **drizzle-kit can't answer its rename prompt in a non-interactive shell:** split "drop column + add column" into two migrations (add first, then drop), as done for 0004/0005.
- **Bookings scope (decided 2026-10-02):** staff-only (no public booking page; the POS isn't reachable from outside), no walk-in queue, no reminders (phone stored only). Times: `src/lib/scheduling.ts` (shop minutes, UTC+8, half-open overlap). A booking occupies its barber while `booked`/`checked_in`. `bookings.order_id` links the sale: set inside `createOrder` **after** the order insert; `confirmPayment` → `completed`; `cancelPendingOrder` → unlinked. The Terminal is **not keyed by booking** (a remount after charging lost the payment dialog); it re-prefills when a different booking id arrives.
- **Testing tip:** the browser tool's `type` action doesn't fire `keydown`, so the PIN pad ignores it — use `key` presses or click the on-screen keypad.

---

## 📝 Session log
- **2026-10-01** — Set up project tracking; planned POS-only redesign; completed Phase 0 (tag, docs) and Phase 1 (strip-down, light theme, shell).
- **2026-10-01** — Phase 2: SQLite data layer, migrations, seed, backups; Terminal reads live catalog.
- **2026-10-01** — Phase 3: staff PIN login, DB sessions, roles, lockout, audit log.
- **2026-10-01** — Phase 4: POS terminal — ticket, discounts with owner approval, DuitNow/cash payment, pending tray, receipts.
- **2026-10-01** — Phase 5: Orders page — filters, search, day summary, sale detail, owner void.
- **2026-10-01** — Phase 6: Day Close + owner Settings (shop/SST/QR, catalog, staff/PINs).
- **2026-10-01** — Phase 7: receipt + day-report printing, production run.bat, cookie/LAN hardening, README. Redesign plan complete.
- **2026-10-01** — Vercel demo prep: Turso support, QR stored in DB, build-time migrate/seed, demo badge, sin1 region. Diagnosed the live 500 (`mkdir 'data'` on read-only Vercel disk).
- **2026-10-02** — Phase 8: staff booking book (calendar, durations, working hours, Start sale → POS), tested end to end; two bugs fixed during testing.
- **2026-10-02** — Self-resetting Vercel demo (no external account): bundled demo DB → /tmp, sample sales, PIN hints. Rehearsed with `VERCEL=1` locally; pushed.
