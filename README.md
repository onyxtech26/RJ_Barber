# 💈 RJ Barber Salon — Booking Management System & WhatsApp Sync Engine

An enterprise-tier, luxury-grade web application and booking management system built for **RJ Barber Salon** ("Haircuts & Shaves Since 2022"). Features a real-time 5-step booking concierge, live Meta WhatsApp Cloud API synchronization, and a full-featured Admin Command Hub.

---

## ✨ Features

- **Luxury Brand Aesthetic**: Deep obsidian theme (`#0A0B0D`), antique brass gold accents (`#D4A437`), and official emblem crest.
- **Interactive Atelier Hallmark**: Custom-engineered mechanical barber pole cylinder with moving stripes, engraved Roman numeral hallmark (`MMXXII`), and live chair radar beacon.
- **5-Step Booking Concierge**:
  - Step 01: Service selection with category filters (*Haircuts, Beard & Shave, Packages*).
  - Step 02: Artisan barber selection (*RJ, Marcus, David* or *Any Available*) with ratings & specialties.
  - Step 03: Morning & Afternoon scheduling matrix with Sunday closures and buffer intervals.
  - Step 04: Client contact input with encrypted live WhatsApp concierge opt-in.
  - Step 05: Luxury appointment pass voucher with monospace reference code (`RJ-XXXXXX`) and Google Calendar export.
- **Self-Service Appointment Concierge (`/manage`)**: Clients can view passes, reschedule, or cancel via unique tokens or directly through WhatsApp.
- **Admin Command Hub (`/dashboard`)**:
  - Live revenue KPIs, appointment counters, and walk-in capacity.
  - Visual chair timeline schedule (`/calendar`).
  - Client directory with appointment history and WhatsApp statuses (`/customers`).
  - Barber roster management and commission rates (`/barbers`).
  - Service catalog pricing editor (`/manage-services`).
  - WhatsApp Cloud API configuration and business hours (`/settings`).
- **Real-Time WhatsApp Integration**: Meta Graph API webhook listener, automated confirmation messages, 2-way bot parser, and 24h/2h reminder scheduling.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router & Turbopack)
- **Language**: TypeScript & React 19
- **Database & ORM**: PostgreSQL & Drizzle ORM
- **UI Components**: Tailwind CSS v4, Base UI, Shadcn, Lucide Icons, Sonner
- **Caching & Locks**: Upstash Redis (Distributed slot locking)
- **Messaging**: Meta WhatsApp Business Cloud API

---

## 🚀 Quick Start

### 1. Launch with One-Click Launcher (Windows)
Double-click `run.bat` in the repository root. It will verify Node.js, install packages if needed, start the dev server, and automatically launch `http://localhost:3000` in your default browser.

### 2. Manual Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Navigate to:
- **Public Storefront**: [http://localhost:3000](http://localhost:3000)
- **Booking Concierge**: [http://localhost:3000/book](http://localhost:3000/book)
- **Admin Command Hub**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

## 🗄️ Database Setup & Seeding

Copy the example environment file:
```bash
cp .env.example .env.local
```

Fill in your PostgreSQL connection string in `DATABASE_URL`, then run:
```bash
# Push schema tables to PostgreSQL
npm run db:push

# Seed master barbers, services catalog, and weekly shifts
npm run db:seed

# (Optional) Open Drizzle Studio to inspect database records
npm run db:studio
```

---

## 📱 Meta WhatsApp Cloud API Setup

Add your Meta developer credentials to `.env.local`:
```env
WHATSAPP_ACCESS_TOKEN="your_access_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_BUSINESS_ACCOUNT_ID="your_business_account_id"
WHATSAPP_VERIFY_TOKEN="your_webhook_verify_token"
WHATSAPP_APP_SECRET="your_app_secret"
```

Configure your webhook in Meta App Dashboard:
- **Callback URL**: `https://your-domain.com/api/webhook/whatsapp`
- **Verify Token**: Must match `WHATSAPP_VERIFY_TOKEN`
- **Fields**: Subscribe to `messages`

---

## 📄 License
Private repository for RJ Barber Salon. All rights reserved.
