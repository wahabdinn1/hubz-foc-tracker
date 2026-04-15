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
  - **Multi-unit returns** — select multiple loaned devices at once; per-item data auto-resolved from Step 3 sheet
  - Standardized **Campaign Dropdowns** with "Other" fallback
  - Auto-fill of Type of FOC from spreadsheet data
  - Precise `writeToNextRow` logic with GMT+7 timestamping
  - **Auto-expanding Sheets** — automatically provisions additional rows via `batchUpdate` before writing if the spreadsheet reaches its grid limit, permanently bypassing the "Range exceeds grid limits" error.
- **Settings** — Admin-only page for managing CC email recipients. PIN-protected with a separate session cookie (1-hour expiry). Full CRUD: add/delete emails via UI, including **Bulk Addition** with comma/newline support and client-side duplicate prevention. Stored in Supabase via Drizzle ORM. The mailer dynamically queries the database for CC recipients with fallback to `CC_EMAILS` env var.
- **Email Notifications** — Automatic email alerts (via Nodemailer + Gmail) sent to admins on every Request, Return, and Transfer action. Modern Shadcn-style HTML template with color-coded action badges. All notifications thread into a **single Gmail conversation** via static subject + `In-Reply-To`/`References` headers. CC recipients are fetched dynamically from the Supabase database.
- **Micro-Animations** — Framer Motion powers fluid card sorting, sliding, and fading transitions throughout the UI.
- **Authentication** — PIN-based access backed by JWT tokens (HS256 via `jose`), enforced by the Next.js 16 Edge proxy intercepting all traffic.
- **Theming & Design** — Light and Dark mode via `next-themes`, glassmorphism UI with frosted-glass panels and responsive Tailwind utilities.
- **Mobile Responsive** — Full mobile support with collapsible sidebar, touch-friendly cards, and adaptive typography.
- **Error & Loading States** — Global `error.tsx` boundary with retry UI, `not-found.tsx` for 404s, and skeleton `loading.tsx` on every route.

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS v4 |
| UI Components | Shadcn UI, Framer Motion |
| State & Theming | `next-themes`, React Hooks |
| Icons | Lucide React |
| Validation | Zod, `react-hook-form` |
| Data Source | Google Sheets API (via Server Actions) |
| Database | Supabase (PostgreSQL) via Drizzle ORM |
| Authentication | `jose` (Edge-compatible JWT), HTTP-only cookies |
| Email | Nodemailer + Gmail SMTP |
| Testing | Vitest, React Testing Library |
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
DATABASE_URL="postgresql://user:password@host:port/database"
EMAIL_USER="your-gmail@gmail.com"
EMAIL_PASS="your-app-password"
ADMIN_EMAIL="admin@wppmedia.com"
DATABASE_URL=""
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
```

All Google variables are required. The application performs **validation at startup** and will fail to initialize if these are missing. `JWT_SECRET` is **required** for JWT signing — authentication will reject all attempts without it.

`DATABASE_URL` is the Supabase PostgreSQL connection string, used by Drizzle ORM for the Settings feature (CC email management). Run `npx drizzle-kit push` to create the database tables after setting this variable.

Email notifications are **optional** — if `EMAIL_USER`, `EMAIL_PASS`, or `ADMIN_EMAIL` are not configured, the system will skip notifications silently without crashing (but will log a warning). To enable, use a [Gmail App Password](https://myaccount.google.com/apppasswords).

### 2. Set Up Database

```bash
npx drizzle-kit push
```

This creates the `cc_recipients` table in your Supabase database using the Drizzle schema defined in `src/db/schema.ts`.

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application. You will be prompted with a PIN entry screen before gaining access to the dashboard.

### 5. Production Build

```bash
pnpm build && pnpm start
```

### 6. Run Tests

```bash
pnpm test          # single run
pnpm test:watch    # watch mode
```

## Documentation

For architecture details, data model documentation, form customization, theming conventions, and troubleshooting, see [DEVELOPING.md](./DEVELOPING.md).
