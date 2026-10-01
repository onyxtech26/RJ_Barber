# RJ Barber Salon — POS Terminal

A point-of-sale terminal for RJ Barber Salon. Customers pay by **DuitNow QR** or **cash**,
and staff confirm each payment in the POS. Runs on the shop's counter PC.

> **Status:** being rebuilt as a POS-only system. See `PROJECT_STATUS.md` for current progress
> and `docs/CHANGELOG.md` for history. The previous booking/WhatsApp system is preserved at the
> git tag `pre-pos-redesign`.

## Stack
- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 · shadcn/Base UI · Lucide icons · Sonner
- Drizzle ORM on SQLite (Phase 2)

## Run it
Double-click `run.bat` (Windows), or:

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Structure
```
src/
  app/            routes — (pos)/ terminal, orders, close, settings · login/
  features/       feature modules (shell, pos, orders, close, catalog, auth)
  components/     shared UI (ui/ = shadcn primitives)
  lib/            small shared helpers
```
