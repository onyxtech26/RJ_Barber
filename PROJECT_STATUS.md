# Project Status — rj-barber-salon

> **Living board.** Read at the start of every session; updated when significant tasks finish. Newest state on top.

**Last updated:** 2026-10-01

---

## 📍 Where I left off
Phases 0–3 done: light POS shell, SQLite data layer, and staff PIN login with DB sessions, owner/staff roles and lockout. The Terminal shows the live catalog read-only. Next: Phase 4 — the POS terminal itself (ticket, charge, DuitNow/cash, pending tray, confirm, receipt).

---

## 🗂️ Board

### ✅ Done
- [x] Set up cross-session project tracking (this system)
- [x] Phase 0 — tagged old system `pre-pos-redesign`, read Next 16 docs (middleware → `proxy.ts`)
- [x] Phase 1 — removed booking/WhatsApp/queue/till/Supabase/Redis; light theme from logo; POS shell + placeholder routes
- [x] Phase 3 — Staff PIN auth: DB-backed sessions (hashed token in httpOnly cookie, 12h), `proxy.ts` cookie-presence redirect, `requireStaff()`/`requireOwner()` DAL checks in pages/queries, owner-only nav, 5-try / 5-min lockout, audit log for login/logout/failures
- [x] Phase 2 — Drizzle on SQLite via `@libsql/client`: schema + CHECK constraints, migrations, seed (RM catalog, placeholder staff, generated PINs), daily backup, `run.bat` prepares DB on launch

### 🔄 In progress
- (nothing active)

### ⏭️ Next / To do
- [ ] Phase 4 — POS terminal: catalog, ticket (barber per line), discount, Charge → DuitNow QR screen / cash change calc → Pending tray → confirm → receipt
- [ ] Phase 5 — Orders: history, search, reprint, owner void with reason
- [ ] Phase 6 — Day close (DuitNow vs cash totals, per-barber sales + commission, lock day) + owner settings
- [ ] Phase 7 — 80mm print layout, tablet QA, tests for pricing/state rules, README

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
- **Testing tip:** the browser tool's `type` action doesn't fire `keydown`, so the PIN pad ignores it — use `key` presses or click the on-screen keypad.

---

## 📝 Session log
- **2026-10-01** — Set up project tracking; planned POS-only redesign; completed Phase 0 (tag, docs) and Phase 1 (strip-down, light theme, shell).
- **2026-10-01** — Phase 2: SQLite data layer, migrations, seed, backups; Terminal reads live catalog.
- **2026-10-01** — Phase 3: staff PIN login, DB sessions, roles, lockout, audit log.
