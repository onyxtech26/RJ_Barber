# Project Status — rj-barber-salon

> **Living board.** Read at the start of every session; updated when significant tasks finish. Newest state on top.

**Last updated:** 2026-10-01

---

## 📍 Where I left off
Phases 0–6 done: terminal, orders, Day Close (report, close/reopen, backup on close) and owner Settings (shop + SST + discount limit + DuitNow QR upload, services & products, staff & PINs). All core features exist. Next: Phase 7 — receipt printing (80mm), tablet QA, production run setup, README.

---

## 🗂️ Board

### ✅ Done
- [x] Set up cross-session project tracking (this system)
- [x] Phase 0 — tagged old system `pre-pos-redesign`, read Next 16 docs (middleware → `proxy.ts`)
- [x] Phase 1 — removed booking/WhatsApp/queue/till/Supabase/Redis; light theme from logo; POS shell + placeholder routes
- [x] Phase 6 — Day Close (DuitNow vs cash, discounts/SST, per-barber net sales + commission, products sold; blocked while sales are pending; freezes snapshot, links orders, blocks new sales and voids for that date, backup on close; owner reopen with reason; unclosed-days reminder) + Settings (shop details, SST with reg no., discount approval limit, DuitNow account name + QR upload served at `/duitnow-qr`; catalog editor with hide-not-delete; staff add/edit/deactivate, last-owner guard, PIN reset that clears lockout and revokes sessions)
- [x] Phase 5 — Orders: URL-based filters (date, status, method, search), day summary (takings / DuitNow / cash / not counted), sale detail with history timeline, owner-only commission view, owner void (paid only, reason required, blocked once the day is closed), audit `order.voided`
- [x] Phase 4 — POS terminal: catalog grid + search, ticket with barber per line, discounts (owner PIN above threshold, shared lockout), server-side pricing/commission/SST, receipt numbers, DuitNow/cash payment screen with change calculator, pending tray, cancel, switch method, receipt dialog; pricing unit tests (`npm test`)
- [x] Phase 3 — Staff PIN auth: DB-backed sessions (hashed token in httpOnly cookie, 12h), `proxy.ts` cookie-presence redirect, `requireStaff()`/`requireOwner()` DAL checks in pages/queries, owner-only nav, 5-try / 5-min lockout, audit log for login/logout/failures
- [x] Phase 2 — Drizzle on SQLite via `@libsql/client`: schema + CHECK constraints, migrations, seed (RM catalog, placeholder staff, generated PINs), daily backup, `run.bat` prepares DB on launch

### 🔄 In progress
- (nothing active)

### ⏭️ Next / To do
- [ ] Phase 7 — receipt reprint button on the order detail page + 80mm print layout; printable Day Close report; production run (`next build` + `next start` in run.bat instead of `next dev`); decide on cookie `secure` for LAN access; README rewrite, tablet QA, tests for pricing/state rules, README

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
- **Testing tip:** the browser tool's `type` action doesn't fire `keydown`, so the PIN pad ignores it — use `key` presses or click the on-screen keypad.

---

## 📝 Session log
- **2026-10-01** — Set up project tracking; planned POS-only redesign; completed Phase 0 (tag, docs) and Phase 1 (strip-down, light theme, shell).
- **2026-10-01** — Phase 2: SQLite data layer, migrations, seed, backups; Terminal reads live catalog.
- **2026-10-01** — Phase 3: staff PIN login, DB sessions, roles, lockout, audit log.
- **2026-10-01** — Phase 4: POS terminal — ticket, discounts with owner approval, DuitNow/cash payment, pending tray, receipts.
- **2026-10-01** — Phase 5: Orders page — filters, search, day summary, sale detail, owner void.
- **2026-10-01** — Phase 6: Day Close + owner Settings (shop/SST/QR, catalog, staff/PINs).
