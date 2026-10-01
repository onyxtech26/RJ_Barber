# RJ Barber Salon — POS Terminal

A point-of-sale system for RJ Barber Salon. Customers pay by **DuitNow QR** or **cash**, and staff
confirm each payment in the POS. It runs on the shop's counter PC — no internet or cloud account needed.

> The previous booking/WhatsApp system is preserved at the git tag `pre-pos-redesign`.
> Progress and decisions: [`PROJECT_STATUS.md`](PROJECT_STATUS.md) · history: [`docs/CHANGELOG.md`](docs/CHANGELOG.md).

---

## What it does

| Area | Who | What |
|---|---|---|
| **Terminal** | Everyone | Build a sale (barber per line, products, discounts, optional customer name) → charge by **DuitNow** (shows the shop QR) or **Cash** (shows change) → confirm payment → print receipt. Unconfirmed sales wait in the **Pending** tray. |
| **Orders** | Everyone | Any day's sales, filters, search by receipt no./name/phone, sale history, reprint. |
| **Void a sale** | Owner | Reverse a paid sale with a reason (refund the customer separately). |
| **Day Close** | Owner | DuitNow total (check against bank), cash in hand, per-barber sales and commission. Closing freezes the day, makes a backup, and stops further sales/voids for that date. Can be reopened. |
| **Settings** | Owner | Shop details, SST, discount limit, DuitNow QR, services & prices, staff & PINs. |

Big discounts (above the limit in Settings) need the owner's PIN. Five wrong PINs lock that person
out for 5 minutes. Everything important is recorded in an audit log.

---

## Daily use

1. **Start:** double-click **`run.bat`**. It prepares the database, takes the daily backup, and opens the POS
   window. Keep the black window open — closing it stops the POS.
2. **Sign in:** tap your name, enter your PIN. Tap **Switch** (top right) when someone else takes over.
3. **Sell:** pick the barber → tap services/products → **DuitNow** or **Cash**.
   - DuitNow: turn the screen to the customer, wait for the bank notification, tap **Payment received**.
   - Cash: enter the amount handed over, give the change shown, tap **Cash received**.
   - Customer not ready? Tap **Leave pending** and finish it later from the **Pending** tray.
4. **End of day (owner):** **Day Close** → check DuitNow against the bank app and count the cash →
   **Close day** → **Print report** if you want a paper copy.

---

## First-time setup on the shop PC

1. Install **Node.js LTS** from <https://nodejs.org/> (defaults are fine).
2. Copy this folder to the PC (for example `C:\RJ-POS`).
3. Double-click **`run.bat`**. The first start installs packages and builds the app (a few minutes).
4. Open **`data\initial-pins.txt`** for the starting PINs, sign in as the owner, then:
   - **Settings → Staff:** rename the sample staff to real names, set commission, and **reset every PIN**.
   - **Settings → Services & products:** set the real services and prices.
   - **Settings → Shop & payments:** shop details, and upload the **DuitNow QR** (a screenshot of the
     shop's static QR from the bank app is fine — PNG/JPEG up to 4 MB).
   - Delete `data\initial-pins.txt` afterwards.
5. Optional: put a shortcut to `run.bat` in the Windows Startup folder (`Win+R` → `shell:startup`).

To start with fixed PINs instead of random ones, copy `.env.example` to `.env.local` and set
`SEED_OWNER_PIN` / `SEED_STAFF_PIN` **before** the first run.

---

## Receipt printer (80 mm)

Receipts are laid out for 80 mm thermal paper and printed through the normal Windows print dialog,
so any receipt printer with a Windows driver works.

1. Install the printer's Windows driver and print a Windows test page.
2. In the print dialog the first time: choose the receipt printer, **Margins: None**, untick
   **Headers and footers**. Edge remembers these.
3. *Optional, no print dialog at all:* start Edge with `--kiosk-printing` so receipts go straight to the
   **default** printer. Only do this if the receipt printer is the Windows default printer — otherwise
   receipts will silently go to the wrong printer. (In `run.bat`, add `--kiosk-printing` next to `--app=`.)

The Day Close report prints on A4 from any normal printer.

---

## Backups and restoring

All data lives in **`data\`** (never commit it):

| File | What |
|---|---|
| `data\rj-pos.db` | The database (all sales, staff, settings). |
| `data\backups\rj-pos-YYYY-MM-DD.db` | Taken each day when the POS starts. Newest 30 kept. |
| `data\backups\rj-pos-close-YYYY-MM-DD.db` | Taken each time a day is closed. Newest 30 kept. |
| `data\uploads\` | The DuitNow QR image. |

**Copy the whole `data` folder to a USB drive or cloud folder regularly** — backups on the same PC don't
help if the PC fails.

**To restore:** close the POS window → copy the chosen backup over `data\rj-pos.db` → delete
`data\rj-pos.db-wal` and `data\rj-pos.db-shm` if they exist → start `run.bat`.

---

## Using a tablet (optional)

By default the POS only accepts connections **from the PC itself** (`127.0.0.1`), so nobody on the shop
Wi-Fi can reach it. To also use a tablet:

1. In `package.json`, change the `start` script from `-H 127.0.0.1` to `-H 0.0.0.0`.
2. Allow Node.js through Windows Firewall on **private** networks only.
3. On the tablet open `http://<PC's IP address>:3000` (find it with `ipconfig`).

Sign-in still requires a staff PIN, but anyone on that Wi-Fi can reach the sign-in screen — use a
private, password-protected network, not a customer Wi-Fi.

---

## Updating the app

Replace the code (keep the `data` folder!), run `npm install` if `package.json` changed, then start
`run.bat`. It notices the code changed, rebuilds once, and applies any database updates automatically.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Window says `[ERROR]` on start | Read the lines above the error; take a photo for support. |
| "Today has been closed by the owner" | Owner: **Day Close → Reopen day** (with a reason). |
| Staff member locked out | Wait 5 minutes, or owner: **Settings → Staff → Reset PIN** (also clears the lock). |
| DuitNow QR not showing on the payment screen | Owner: **Settings → Shop & payments → Upload QR image**. |
| Receipt has margins or a header/date line | In the print dialog: Margins **None**, untick **Headers and footers**. |
| Port 3000 already in use | The POS is probably already running — `run.bat` will just open the window. |

---

## For developers

```bash
npm install
npm run db:setup     # migrations + seed (no-op if data exists)
npm run dev          # http://localhost:3000
npm test             # pricing / money unit tests
```

| Script | Purpose |
|---|---|
| `db:generate` | Create a migration from schema changes (**read the generated SQL before applying**). |
| `db:migrate` | Apply pending migrations. |
| `db:seed` / `db:reset` | Seed an empty DB / wipe and re-seed (dev only). |
| `db:backup` | Daily backup (also run by `run.bat`). |
| `db:studio` | Browse the database. |
| `build` / `start` | Production build / server on `127.0.0.1:3000`. |

**Stack:** Next.js 16 (App Router, Server Actions, `proxy.ts`), React 19, TypeScript, Tailwind CSS 4,
shadcn/Base UI, Drizzle ORM on SQLite via `@libsql/client`, zod. This Next.js version has breaking
changes — read `node_modules/next/dist/docs/` before changing framework-level code (see `AGENTS.md`).

```
src/
  app/            routes: (pos)/ terminal, orders, close, settings · login/ · print/ · duitnow-qr/
  features/       one folder per feature: pos, orders, close, settings, catalog, auth, shell
  server/         db (schema, migrations, scripts), auth (PIN, sessions, lockout), audit, uploads
  lib/            shared pure helpers: money, pricing (+ tests), dates, enums, print
  components/     shared UI (ui/ = shadcn primitives)
scripts/          needs-build.mjs (used by run.bat)
```

**Rules that keep the money right**

- Money is integer **sen**; rates are **basis points** (5000 = 50%). Never floats.
- The browser never sends prices. Every Server Action recomputes totals from the database with
  `src/lib/pricing.ts` — the same function the terminal uses for its preview.
- Every page, query and Server Action checks the session with `requireStaff()` / `requireOwner()`.
  `proxy.ts` is only a fast redirect, not security.
- Orders are never deleted. Status changes (`awaiting_payment → paid / cancelled`, `paid → voided`)
  are conditional updates, so two clicks or two devices can't both succeed.

## License

Private repository for RJ Barber Salon. All rights reserved.
