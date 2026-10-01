# Project Status — rj-barber-salon

> **Living board.** Read at the start of every session; updated when significant tasks finish. Newest state on top.

**Last updated:** 2026-10-01

---

## 📍 Where I left off
Phases 0–1 done: the app is stripped to a POS-only shell with the light logo theme (Terminal / Orders / Day Close / Settings / Login placeholders). Next: Phase 2 — Drizzle + SQLite schema, migrations, seed.

---

## 🗂️ Board

### ✅ Done
- [x] Set up cross-session project tracking (this system)
- [x] Phase 0 — tagged old system `pre-pos-redesign`, read Next 16 docs (middleware → `proxy.ts`)
- [x] Phase 1 — removed booking/WhatsApp/queue/till/Supabase/Redis; light theme from logo; POS shell + placeholder routes

### 🔄 In progress
- (nothing active)

### ⏭️ Next / To do
- [ ] Phase 2 — Data layer: Drizzle on SQLite (`better-sqlite3`), schema (shop_settings, staff, service_categories, services, orders, order_items, day_closes, audit_log), migrations, seed in RM, daily DB file backup
- [ ] Phase 3 — Auth: staff PIN pad, hashed PINs, signed httpOnly session cookie, `proxy.ts` optimistic redirect + server-side guards, owner/staff roles, lockout
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
- **Hosting/DB:** no Supabase for now. SQLite file on the shop PC (single counter device), app launched via `run.bat`.
- **Theme:** light only. Tokens in `src/app/globals.css`: `--primary` = black ink, `--brand` = logo yellow `#F5C400` used only as a fill with black text (Charge button, active nav).
- **Next 16:** `middleware.ts` is renamed `proxy.ts`; use it only for optimistic redirects — real auth checks live in server code.

---

## 📝 Session log
- **2026-10-01** — Set up project tracking; planned POS-only redesign; completed Phase 0 (tag, docs) and Phase 1 (strip-down, light theme, shell).
