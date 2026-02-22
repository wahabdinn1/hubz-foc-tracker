# Hubz FOC Tracker

Hubz FOC Tracker is an internal analytics dashboard and logistics tracking portal for managing the full lifecycle of Free-of-Charge (FOC) device loans. It aggregates device check-ins, check-outs, and return schedules from Google Sheets into a unified, responsive interface purpose-built for Key Opinion Leader (KOL) operations.

## Features

- **Dashboard** — Analytical views showing available stock, outstanding loans, unreturned devices, and pending returns. Includes top 3 urgent return tracking and recent activity feeds.
- **Inventory Bank** — Robust Data hub: Group identical models beautifully on the `ModelsTab` or utilize the heavy-data `MasterListTab` equipped with instant multi-select Status filters and dynamic `sticky` table headers.
- **KOL Directory** — Iterates over Google Sheets row data to dynamically assemble cohesive Key Opinion Leader portals displaying combined hardware histories and specific contact addresses.
- **Form Modals** — Outbound (loan) and Inbound (return) data submission forms securely validated by centralized Zod Schemas.
- **Micro-Animations** — Framer Motion integrates deep into the UI; filtering arrays causes cards to fluidly sort, slide, and fade rather than snapping abruptly. 
- **Authentication** — PIN-based access backed by JWT tokens (HS256 via `jose`), strictly enforced by the `proxy.ts` Edge Server architecture intercepting traffic before initial renders.
- **Theming & Design** — Pristine Light mode & Dark mode system utilizing `next-themes` wrapped over Aceternity UI floating frosted glass components and responsive Tailwind utilities.
- **Mobile Responsive** — Horizontal data tables instantly collapse into touch-friendly vertical tracking cards on mobile viewports so teams can work securely via smartphones without frustrating horizontal scrolling.

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS v4 |
| UI Components | Shadcn UI, Aceternity UI (Framer Motion) |
| State and Theming | `next-themes`, React Hooks |
| Icons | Lucide React, Tabler Icons |
| Validation | Zod, `react-hook-form` |
| Data Source | Google Sheets API (via Server Actions) |
| Authentication | `jose` (Edge-compatible JWT), HTTP-only cookies |

## Getting Started

### 1. Environment Configuration

Create a `.env.local` file at the project root with the following variables:

```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_SHEET_ID="your_google_sheet_id_here"
AUTHORIZED_PINS="123456,654321"
```

All variables are required. The application will fail at runtime if `GOOGLE_PRIVATE_KEY` is not set.

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

For architecture details, data model documentation, theming conventions, and troubleshooting, see [DEVELOPING.md](./DEVELOPING.md).
