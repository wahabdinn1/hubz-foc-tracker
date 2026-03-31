# Hubz FOC Tracker — Developer Guide

This document covers the architecture, data flow, conventions, and security model for the Hubz FOC Tracker. It is intended as a reference for anyone modifying or extending the codebase.

---

## Architecture

The application is built on **Next.js (App Router)** with **Server Actions** acting as the data layer between client components and the Google Sheets API.

### Directory Structure

```
src/
  app/                         # Next.js App Router pages
    page.tsx                   # Analytics Dashboard (root)
    inventory/page.tsx         # Dedicated Inventory Bank
    kol/page.tsx               # Dedicated KOL Directory
    layout.tsx                 # Root layout + ThemeProvider
    globals.css                # Design tokens, custom scrollbars

  components/
    layout/                    # App-shell components
      DashboardLayout.tsx      # Sidebar navigation + responsive header
      ThemeProvider.tsx         # next-themes wrapper
      ThemeToggle.tsx           # Light/dark mode toggle button
    shared/                    # Reusable cross-feature components
      QuickViewPanel.tsx       # Slide-over device detail panel
      Scorecard.tsx            # Animated stat card with spotlight effect
      PinModal.tsx             # Authentication PIN lock screen
      ErrorBoundary.tsx        # React error boundary with retry UI
      Skeletons.tsx            # Loading skeleton components
    forms/                     # Data-entry modals
      RequestFormModal.tsx     # Outbound (loan) request form
      ReturnFormModal.tsx      # Inbound (return) form
    dashboard/                 # Dashboard-specific widgets
      DashboardClient.tsx      # Dashboard state orchestrator
      ReturnTrackingTable.tsx  # Urgent return tracking table
      ActivityFeed.tsx         # Recent activity timeline
    inventory/                 # Inventory tab components
      InventoryClient.tsx      # Inventory view orchestrator
      MasterListTab.tsx        # Searchable/sortable device table
      ModelsTab.tsx            # Grouped-by-model accordion view
      CampaignsTab.tsx         # Grouped-by-campaign view
    kol/                       # KOL directory components
      KOLClient.tsx            # KOL list + individual profile views
    ui/                        # Shadcn primitives + custom components

  types/
    inventory.ts               # Centralized TypeScript interfaces
                               #   InventoryItem, ReturnTrackingItem,
                               #   KOLProfile, ActionResult

  lib/
    auth.ts                    # Shared server-side JWT verification
    constants.ts               # Magic strings, sheet names, config values
    date-utils.ts              # Shared date/urgency helpers (getReturnUrgency, isItemOverdue)
    validations.ts             # Centralized Zod schemas
    utils.ts                   # Tailwind class merge & helpers
    rate-limit.ts              # In-memory PIN brute-force prevention

  server/
    actions.ts                 # Barrel re-export of all server actions
    inventory.ts               # getInventory() + revalidateInventory()
    mutations.ts               # requestUnit() + returnUnit()
    auth.ts                    # verifyPin() server action
    google.ts                  # Google Sheets API client setup

  proxy.ts                     # Edge middleware (JWT verification)
```

### Module Responsibilities

| Module | Responsibility |
|---|---|
| `server/inventory.ts` | Fetches and transforms data from Google Sheets; cached with 30s TTL |
| `server/mutations.ts` | Appends rows to "Step 3" (request) and "Step 4" (return) sheets |
| `server/auth.ts` | PIN verification, JWT signing, cookie management |
| `types/inventory.ts` | `InventoryItem`, `ReturnTrackingItem`, `KOLProfile`, `ActionResult` type definitions |
| `lib/constants.ts` | Sheet names, column header lookups, auth config, status strings |
| `lib/date-utils.ts` | `getReturnUrgency()`, `isItemOverdue()`, `isEmptyValue()` — shared date/urgency logic |
| `lib/validations.ts` | Zod schemas shared between client forms and server actions |
| `lib/auth.ts` | `isAuthenticated()` — shared JWT verification for pages and actions |

---

## Data Model

### Google Sheets Integration

Data is sourced from the sheet named **"Step 1 Data Bank"**, columns A through P.

The `getInventory()` server action reads the sheet and maps each row to the `InventoryItem` interface:

| Field | Sheet Column (2026) | Lookup Header |
|---|---|---|
| `imei` | F (index 5) | SERIAL NUMBER (IMEI/SN) |
| `unitName` | G (index 6) | UNIT NAME |
| `focStatus` | H (index 7) | FOC STATUS |
| `plannedReturnDate` | I (index 8) | PLANNED RETURN DATE |
| `seinPic` | D (index 3) | SEIN PIC NAME |
| `goatPic` | K (index 10) | GOAT PIC (PLANNER) |
| `campaignName` | L (index 11) | CAMPAIGN NAME |
| `statusLocation` | N (index 13) | STATUS LOCATION |
| `onHolder` | O (index 14) | ON HOLDER |

Column lookups use **header-name matching first** (defined in `lib/constants.ts` → `COLUMN_HEADERS`), falling back to positional indices. This means the sheet columns can be reordered without breaking the application, as long as header names are preserved.

### Dynamic Full Data

Every row also generates a `fullData` dictionary keyed by header names. This powers the `QuickViewPanel`, which renders all columns dynamically. Hidden/irrelevant columns are filtered using `QUICKVIEW_HIDDEN_KEYS` from `lib/constants.ts`.

### Real-time Caching and Revalidation

- `getInventory()` is wrapped in `unstable_cache` with a 30-second TTL (configured via `CACHE_REVALIDATE_SECONDS` in constants).
- Mutations immediately fire `revalidatePath('/', 'layout')` to drop the cache.
- The request-date cross-reference reads **"Step 3 FOC Request"** to resolve timestamps per device.

---

## Authentication and Security

### Flow

1. User enters a 6-digit PIN via `PinModal`.
2. `verifyPin()` (in `server/auth.ts`) checks against `AUTHORIZED_PINS`.
3. On success, a JWT is signed and set as HTTP-only cookie (`foc_auth_token`).
4. The edge proxy (`src/proxy.ts`) intercepts all routes and verifies the JWT.
5. Server actions independently verify authentication before processing mutations.

### Rate Limiting

Failed PIN attempts are tracked by `lib/rate-limit.ts`. After exceeding the maximum, the user is locked out for 15 minutes.

### Security Properties

- **No fallback secret** — If both `JWT_SECRET` and `GOOGLE_PRIVATE_KEY` are unset, all auth is rejected.
- **HTTP-only cookies** — JWT cannot be accessed by client-side JavaScript.
- **`secure` flag** — Cookie is HTTPS-only in production.
- **`sameSite: "lax"`** — Prevents cross-site request attachment.
- **Server action auth gates** — Mutations reject unauthenticated callers.

---

## Theming Conventions

The application uses `next-themes` with Tailwind CSS class strategy.

### Required Pattern

Every UI element must define both light and dark mode classes:

```
bg-white dark:bg-neutral-900
border-neutral-200 dark:border-neutral-800
text-neutral-900 dark:text-neutral-100
transition-colors
```

Do not use dark-only classes without a light mode counterpart.

### Responsive Design

The app follows a mobile-first approach using Tailwind `sm:` / `md:` / `lg:` breakpoints:

- **Mobile (< 640px)**: Full-width layouts, vertical card stacks, hamburger nav
- **Tablet (640–1024px)**: 2-column grids, compact sidebar
- **Desktop (> 1024px)**: Expandable sidebar, multi-column dashboards

### Scrollbar

Custom scrollbar styles are defined in `globals.css` with separate light and dark mode colors.

### Performance Conventions

- **`useMemo`** — Wrap expensive array computations (filter, sort, reduce) in `useMemo`. Both `DashboardClient` and `MasterListTab` follow this pattern.
- **Avoid render-time state updates** — Use `useEffect` when resetting `currentPage` or similar derived state, not inline during render.
- **Stable React keys** — Use composite keys (`${item.imei}-${item.unitName}-${idx}`) instead of array indices.

### Error Handling

- **Form submissions** — All server action calls in form modals (`RequestFormModal`, `ReturnFormModal`) are wrapped in `try/catch` to handle network-level failures with user-friendly toast messages.
- **PinModal** — Shows a loading spinner overlay during authentication and catches network errors.

### ESLint

The project uses `eslint-config-next` with:
- `@typescript-eslint/no-unused-vars` (warn)
- `prefer-const` (warn)
- `no-console` (warn, except `warn`/`error`)

Run `npx eslint .` to check for linting issues.

---

## SEO & PWA

- Each page exports unique `metadata` with descriptive `title` and `description`.
- The root layout provides a title template: `"%s"` (pages set their own full title).
- A branded SVG favicon (`src/app/icon.svg`) and PWA manifest (`public/manifest.json`) are included.

---

## Troubleshooting

**Sheet column headers changed** — Update the corresponding entry in `lib/constants.ts` → `COLUMN_HEADERS`. The lookup system tries multiple header names in priority order.

**Google API 429 errors** — The cache TTL is 30 seconds. Adjust `CACHE_REVALIDATE_SECONDS` in `lib/constants.ts` if needed.

**Missing KOL entries** — The KOL directory groups by the `ON HOLDER` field. Inconsistent spelling in the sheet creates duplicate profiles.

**Build fails with missing env vars** — All three Google credentials must be present. `AUTHORIZED_PINS` must also be set for auth.

**Adding a new hidden column to QuickView** — Add the lowercase key to `QUICKVIEW_HIDDEN_KEYS` in `lib/constants.ts`.
