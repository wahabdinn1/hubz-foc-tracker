# Hubz FOC Tracker — Developer Guide

This document covers the architecture, data flow, conventions, and security model for the Hubz FOC Tracker. It is intended as a reference for anyone modifying or extending the codebase.

---

## Architecture

The application is built on **Next.js (App Router)** with **Server Actions** acting as the data layer between client components and the Google Sheets API.

### Directory Structure

```
src/
  app/                    # Route definitions
    page.tsx              # Analytics Dashboard (root)
    inventory/page.tsx    # Dedicated Inventory Bank
    kol/page.tsx          # Dedicated KOL Directory
    layout.tsx            # Root layout containing the ThemeProvider
    globals.css           # Design tokens, custom scrollbar styles
  components/             # Client components
    DashboardClient.tsx   # Dashboard state orchestrator
    dashboard/            # Modular dashboard widgets (ActivityFeed, ReturnTracking)
    InventoryClient.tsx   # Inventory view orchestrator
    inventory/            # Modular inventory tabs (MasterList, ModelsTab, Campaigns)
    KOLClient.tsx         # KOL directory list and individual profile generator
    DashboardLayout.tsx   # Sidebar navigation and responsive headers wrapper
    RequestFormModal.tsx  # Outbound (loan) form UI
    ReturnFormModal.tsx   # Inbound (return) form UI
    PinModal.tsx          # Authentication PIN lock screen
    QuickViewPanel.tsx    # Slide-over detail panel pulling out fullData maps
    ThemeToggle.tsx       # Light/dark mode standard toggle
    ui/                   # Shadcn primitives + Aceternity interactive backdrops
  lib/
    auth.ts               # Shared server-side JWT verification engine
    validations.ts        # Centralized Zod schema validation rules
    utils.ts              # Tailwind class merge & helper utilities
    rate-limit.ts         # In-memory edge login brute-force prevention
  proxy.ts                # Next.js Server Edge proxy (intercepts all traffic for JWT validation)
  server/
    actions.ts            # Server Actions (Mutations, Form appends, Google Data Fetches)
    google.ts             # Google Sheets API client and service-account configurations
```

---

## Data Model

### Google Sheets Integration

Data is sourced from the sheet named **"Step 1 Data Bank"**, columns A through O.

The `getInventory()` server action reads the sheet and maps each row to the `InventoryItem` interface:

| Field | Sheet Column | Lookup Header |
|---|---|---|
| `imei` | D (index 3) | IMEI |
| `unitName` | E (index 4) | Unit Name |
| `focStatus` | F (index 5) | RETURN / UNRETURN |
| `plannedReturnDate` | G (index 6) | Planned Return Date |
| `seinPic` | C (index 2) | PIC SEIN |
| `goatPic` | I (index 8) | PIC GOAT |
| `campaignName` | J (index 9) | Campaign Name |
| `statusLocation` | L (index 11) | STATUS LOCATION |
| `onHolder` | M (index 12) | ON HOLDER |

Column lookups use **header-name matching first**, falling back to positional indices. This means the sheet columns can be reordered without breaking the application, as long as header names are preserved.

### Dynamic Full Data

Every row also generates a `fullData` dictionary keyed by header names. This powers the `QuickViewPanel`, which renders all columns without hardcoded field names.

### Real-time Caching and Revalidation

- `getInventory()` is wrapped in `unstable_cache` bound to the `'inventory-data'` tag with a highly aggressive 30-second TTL fallback.
- Submitting a mutation (such as `requestUnit` or `returnUnit`) immediately fires `revalidateTag('inventory-data')` followed by `revalidatePath('/', 'layout')`. This provides **Zero-Latency State Synchronization**: as soon as Google Sheets acknowledges the write operation, the cached dataset is dropped and the next render pulls fresh data globally.
- Mutations write out cleanly into their own respective tables: **"Step 3 FOC Request"** and **"Step 4 FOC Return"**.

---

## Authentication and Security

### Flow

1. User enters a 6-digit PIN via `PinModal`.
2. `verifyPin()` checks the input against `AUTHORIZED_PINS` (comma-separated env var).
3. On success, a JWT is signed with `GOOGLE_PRIVATE_KEY` using HS256 and set as an HTTP-only cookie (`foc_auth_token`) with `sameSite: "lax"`.
4. The edge proxy (`src/proxy.ts`) intercepts all routes and verifies the JWT. Failed auth sets a header but does not redirect (the page-level `isAuthenticated()` check handles rendering the PIN modal).
5. Server actions (`requestUnit`, `returnUnit`) independently verify authentication before processing mutations.

### Security Properties

- **No fallback secret** — If `GOOGLE_PRIVATE_KEY` is unset, the application will reject all auth operations rather than using a hardcoded fallback.
- **HTTP-only cookies** — The JWT cannot be accessed by client-side JavaScript.
- **`secure` flag** — Cookie is HTTPS-only in production.
- **`sameSite: "lax"`** — Prevents the cookie from being sent in cross-site requests.
- **Server action auth gates** — Mutation endpoints reject unauthenticated callers.

### Shared Auth Utility

`src/lib/auth.ts` exports `isAuthenticated()`, used by all page server components and server actions. This eliminates duplicated JWT verification logic.

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

### Scrollbar

Custom scrollbar styles are defined in `globals.css` with separate light and dark mode colors using `.dark` scoping.

### Hydration Warning

The `<html>` tag in `layout.tsx` includes `suppressHydrationWarning` — this is required by `next-themes` to prevent hydration mismatch errors when the theme class is injected before React hydrates.

---

## Troubleshooting

**Sheet column headers changed** — The `getInventory()` function uses header-name matching. If a header name changes in the sheet (e.g., "IMEI" is renamed), update the corresponding `col()` call in `server/actions.ts`.

**Google API 429 errors** — The cache TTL is 30 seconds. Avoid triggering rapid sequential syncs. If the issue persists, increase the `revalidate` value in `getInventory()`.

**Missing KOL entries** — The KOL directory groups devices by the `ON HOLDER` field. Inconsistent spelling or casing in the sheet will create duplicate or missing KOL profiles.

**Build fails with missing env vars** — All three Google credentials (`GOOGLE_PRIVATE_KEY`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_SHEET_ID`) must be present. The `AUTHORIZED_PINS` variable must also be set for authentication to function.
