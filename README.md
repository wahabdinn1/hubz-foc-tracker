# Hubz FOC Tracker

Hubz FOC Tracker is an internal analytics dashboard and logistics tracking portal for managing the full lifecycle of Free-of-Charge (FOC) device loans. It aggregates device check-ins, check-outs, and return schedules from Google Sheets into a unified, responsive interface purpose-built for Key Opinion Leader (KOL) operations.

## Features

- **Dashboard** — Analytical views with scorecards for available stock, outstanding loans, unreturned devices, and pending returns. Includes urgent return tracking, overdue surface data, and recent activity feeds.
- **Inventory Bank** — Robust data hub with three tabs:
  - **Master List** — Full device table with multi-column sorting, text search, and color-coded FOC Status badges (Return/Unreturn).
  - **Device Models** — 3-level drill-down hierarchy: Base Model → Variant → Individual Units with IMEI, holder, and FOC status detail cards.
  - **Campaigns** — Devices grouped by active campaign name.
- **KOL Directory** — Dynamically assembled Key Opinion Leader profiles from device tracking data, displaying combined hardware histories and contact details.
- **QuickView Panel** — Slide-over detail panel with request timeline visualization and complete data record for any device.
- **Forms** — Outbound (loan request), Inbound (return), and Direct Transfer modals with:
  - 2-step device selection (Category → Unit/IMEI)
  - Standardized **Campaign Dropdowns** with "Other" fallback
  - Auto-fill of Type of FOC from spreadsheet data
  - Precise `writeToNextRow` logic with GMT+7 timestamping
- **Micro-Animations** — Framer Motion powers fluid card sorting, sliding, and fading transitions throughout the UI.
- **Authentication** — PIN-based access backed by JWT tokens (HS256 via `jose`), enforced by Edge middleware intercepting all traffic.
- **Theming & Design** — Light and Dark mode via `next-themes`, glassmorphism UI with frosted-glass panels and responsive Tailwind utilities.
- **Mobile Responsive** — Full mobile support with collapsible sidebar, touch-friendly cards, and adaptive typography.

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS v4 |
| UI Components | Shadcn UI, Framer Motion |
| State & Theming | `next-themes`, React Hooks |
| Icons | Lucide React, Tabler Icons |
| Validation | Zod, `react-hook-form` |
| Data Source | Google Sheets API (via Server Actions) |
| Authentication | `jose` (Edge-compatible JWT), HTTP-only cookies |
| Package Manager | pnpm |

## Getting Started

### 1. Environment Configuration

Create a `.env.local` file at the project root with the following variables:

```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_SHEET_ID="your_google_sheet_id_here"
AUTHORIZED_PINS="123456,654321"
JWT_SECRET="your_jwt_signing_secret_here"
```

All Google variables are required. The application will fail at runtime if `GOOGLE_PRIVATE_KEY` is not set. `JWT_SECRET` is **required** for JWT signing — the application will reject all authentication attempts without it.

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application. You will be prompted with a PIN entry screen before gaining access to the dashboard.

### 4. Production Build

```bash
pnpm build && pnpm start
```

## Documentation

For architecture details, data model documentation, form customization, theming conventions, and troubleshooting, see [DEVELOPING.md](./DEVELOPING.md).
