# Hubz FOC Tracker

Hubz FOC Tracker is an internal analytics dashboard and logistics tracking portal for managing the full lifecycle of Free-of-Charge (FOC) device loans. It aggregates device check-ins, check-outs, and return schedules from Google Sheets into a unified, responsive interface purpose-built for Key Opinion Leader (KOL) operations.

## Features

- **Dashboard** — High-performance analytical views with **Server-Side Data Aggregation**. Includes scorecards for available stock, outstanding loans, unreturned devices, and pending returns. Features a high-fidelity **Status Hub** sidebar and urgent return tracking, with a clean layout optimized for operational oversight (redundant charts removed for maximum clarity).
- **Inventory Bank** — High-density data hub with interactive overview stats and three specialized tabs:
  - **Inventory Summary Bar** — Real-time metrics (Total, Available, Loaned, Unreturned) with glassmorphic styling and responsive grid layout, powered by `useInventoryStats`.
  - **Master List** — Optimized data ledger with multi-column sorting, text search, and **Integrated Pagination** within a unified glassmorphic container.
  - **Device Models** — 3-level drill-down hierarchy: Base Model → Variant → Individual Units with IMEI, holder, and FOC status detail cards.
  - **Campaigns** — Devices grouped by active campaign name with standardized empty states.
- **Performance Optimized** — Built for high-density interaction with:
  - **Reduced Animation Overhead** — Optimized DOM transitions (removed per-row motion wrappers) for buttery-smooth scrolling on large datasets.
  - **Request Deduplication** — Utilizes `React.cache` for per-request data fetching optimization.
  - **List Virtualization** — Efficiently handles thousands of records using `TanStack Virtual` in the Return Tracking and Activity components.
  - **Server-Side Calculations** — KPI and stat aggregation performed on the server to minimize client-side processing.
- **KOL Directory** — Dynamically assembled Key Opinion Leader profiles from device tracking data, displaying combined hardware histories and contact details.
- **QuickView Panel** — Slide-over detail panel with request timeline visualization and complete data record for any device.
- **Forms** — Outbound (loan request), Inbound (return), and Direct Transfer modals with:
  - 2-step device selection (Category → Unit/IMEI)
  - **Transfer Form Optimization** — Restored top-level Category/IMEI selection; auto-fills Requestor, Unit Name, and Current Holder; conditional visibility for device details after IMEI selection.
  - **Requestor Auto-fill** — Automatically resolves and displays the original requestor from the Step 3 FOC Request sheet (Column C); includes dynamic option injection for historical data persistence.
  - **Type of FOC** displayed inline next to Unit Name, visible only after IMEI selection, auto-filled from spreadsheet data
  - **Multi-unit requests** — add multiple device rows per submission via `useFieldArray`; batch write to Google Sheets with `sendFocBatchNotification`
  - **Multi-unit returns** — select multiple loaned devices at once; per-item data auto-resolved from Step 3 sheet
  - **UX Enhancements** — Includes "Discard changes" confirmation for dirty forms and smooth-scroll-to-error handling.

### UI/UX Improvements
- [x] **Form Discard Confirmation** — Show "Discard changes?" dialog when closing a dirty form.
- [x] **Scroll-to-Error** — On form validation failure, smooth-scroll to the first error field.
- [x] **Dashboard UI Refinement** — Cleaned up dashboard layout by removing date filters and distribution charts.
- [x] **Inventory Summary Bar** — Integrated dynamic, glassmorphic fleet statistics providing at-a-glance operational visibility.
- [x] **Mobile-Optimized Inventory** — Implemented responsive tab navigation and consolidated data containers with integrated pagination.
- [x] **Standardized Empty States** — Unified zero-data visualization across all inventory views.

## Technical Maintenance
- **Precise `writeToNextRow`** — Uses `OVERWRITE` with explicit range targeting to guarantee data appends exactly below the last active row.
- **Auto-expanding Sheets** — Automatically provisions additional rows via `batchUpdate` if the spreadsheet reaches its grid limit.
- **Layout Stability** — Unified glassmorphic containers stabilize layout shifts during filtering or pagination.
- **Settings** — Admin-only page for managing CC email recipients. PIN-protected with a separate session cookie (1-hour expiry). Full CRUD: add/delete emails via UI, including **Bulk Addition** with comma/newline support and client-side duplicate prevention. Stored in Supabase via Drizzle ORM.
- **Email Notifications** — Automatic email alerts (via Nodemailer + Gmail) sent to admins on every Request, Return, and Transfer action. Modern Shadcn-style HTML template with color-coded action badges. All notifications thread into a **single Gmail conversation** via static subject + `In-Reply-To`/`References` headers.
- **Micro-Animations** — Framer Motion powers fluid card sorting, sliding, and fading transitions throughout the UI.
- **Authentication** — PIN-based access backed by JWT tokens (HS256 via `jose`), enforced by the Next.js 16 Edge proxy intercepting all traffic.
- **Theming & Design** — Light and Dark mode via `next-themes`, glassmorphism UI with frosted-glass panels and responsive Tailwind utilities.
- **Mobile Responsive** — Full mobile support with collapsible sidebar, touch-friendly cards, and adaptive typography.
- **Feature-Based Architecture** — Domain-specific logic (actions, components, and utils) is modularized into `src/features/` (auth, inventory, dashboard, settings), promoting scalability and clear separation of concerns.
- **UX Stability** — Navigation persistence via layout-wrapped loading states, ensuring the sidebar remains interactive during data fetches.
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
| Performance | TanStack Virtual, `React.cache` |

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
