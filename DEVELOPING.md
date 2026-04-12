# Hubz FOC Tracker — Developer Guide

This document covers the architecture, data flow, conventions, security model, and **step-by-step guides for common customization tasks** (adding requestors, changing form fields, updating delivery types, etc.).

---

## Architecture

The application is built on **Next.js 16 (App Router)** with **Server Actions** acting as the data layer between client components and the Google Sheets API.

### Directory Structure

```
src/
  app/                         # Next.js App Router pages
    page.tsx                   # Analytics Dashboard (root)
    inventory/page.tsx         # Dedicated Inventory Bank
    kol/page.tsx               # Dedicated KOL Directory
    audit/page.tsx             # Audit Log
    faq/page.tsx               # Help Center / FAQ
    layout.tsx                 # Root layout + ThemeProvider
    globals.css                # Design tokens, custom scrollbars
    error.tsx                  # Global error boundary with retry
    not-found.tsx              # 404 page
    loading.tsx                 # Root loading skeleton

  components/
    layout/                    # App-shell components
      DashboardLayout.tsx      # Sidebar navigation + responsive header
      ThemeProvider.tsx         # next-themes wrapper
      ThemeToggle.tsx           # Light/dark mode toggle button
    shared/                    # Reusable cross-feature components
      PageHeader.tsx           # Unified page header toolbar (theme, sync, forms, Cmd+K)
      CommandPalette.tsx       # Global Cmd+K search across nav, KOLs, campaigns
      QuickViewPanel.tsx       # Slide-over device detail panel
      Scorecard.tsx            # Animated stat card with spotlight effect
      PinModal.tsx             # Authentication PIN lock screen
      ErrorBoundary.tsx        # React error boundary with retry UI
      DiscardGuardDialog.tsx   # Reusable "Discard changes?" confirmation dialog
      Skeletons.tsx            # Loading skeleton components
    forms/                     # Data-entry modals
      RequestFormModal.tsx     # Outbound (loan) request form
      ReturnFormModal.tsx      # Inbound (return) form — multi-unit selection
      TransferFormModal.tsx    # Direct transfer between KOLs (orchestrator only)
      MultiImeiReturnSelector.tsx  # Multi-select IMEI combobox for return form
      ImeiReturnSelector.tsx   # Single-select IMEI combobox (legacy)
      BatchReturnDialog.tsx    # Batch return dialog (legacy, unused)
      shared/                  # Shared form sub-components
        UsernameEmailInput.tsx # Username + EMAIL_DOMAIN suffix input
      request/                 # Request form sub-components
        RequestFormCampaign.tsx
        RequestFormDevice.tsx
        RequestFormKol.tsx
        RequestFormDelivery.tsx
      transfer/               # Transfer form sub-components
        TransferFormDevice.tsx # Requestor + category + IMEI + holder
        TransferFormDetails.tsx # FOC type + date + campaign
        TransferFormNewKol.tsx  # KOL 2 fields
    dashboard/                 # Dashboard-specific widgets
      DashboardClient.tsx      # Dashboard state orchestrator
      DashboardDonutChart.tsx  # Lightweight SVG donut chart (replaces recharts)
      ReturnTrackingTable.tsx  # Urgent return tracking table
      ActivityFeed.tsx         # Recent activity timeline
      OverduePanel.tsx         # Overdue items panel
      ReturnHistoryPanel.tsx   # Return history panel
    inventory/                 # Inventory tab components
      InventoryClient.tsx      # Inventory view orchestrator
      MasterListTab.tsx        # Searchable/sortable device table with page-jump
      ModelsTab.tsx            # 3-level grouped-by-model view
      CampaignsTab.tsx         # Grouped-by-campaign view
    kol/                       # KOL directory components
      KOLClient.tsx            # KOL list + individual profile views
    ui/                        # Shadcn primitives + custom components
      EmptyState.tsx           # Reusable empty state with icon + message

  types/
    inventory.ts               # Centralized TypeScript interfaces
                               #   InventoryItem, Step1Data, Step3RefData,
                               #   KOLProfile, ActionResult, OverdueItem,
                               #   ReturnHistoryItem, RequestHistoryItem

  lib/
    auth.ts                    # Shared server-side JWT verification
    constants.ts               # Centralized constants: STEP1_COLS, STEP3_COLS,
                               #   STEP4_COLS, REQUESTORS, FOC_TYPES,
                               #   DELIVERY_TYPES, CAMPAIGNS, DEVICE_CATEGORIES,
                               #   FOC_TYPE_KEYS, sheet names, auth config, etc.
    form-utils.ts              # Shared form helpers: resolveRequestorWithFallback(),
                               #   resolveFocTypeWithMatch()
    device-utils.ts            # Shared device helpers: getDeviceCategory(), getCategoryIcon(), extractFocType()
    date-utils.ts              # Shared date/urgency helpers
    validations.ts             # Centralized Zod schemas (request + return + transfer)
    utils.ts                   # Tailwind class merge & helpers
    rate-limit.ts              # In-memory per-IP PIN brute-force prevention
    mailer.ts                  # Nodemailer email notification utility (Gmail-threaded)

  hooks/
    useInventoryStats.ts       # Derives stats (available, loaned, etc.) from inventory
    useSyncInventory.ts        # Centralized sync-with-Sheets + transition state
    useScrollToFirstError.ts   # Shared onInvalid handler for react-hook-form
    useDeviceCategories.ts     # Shared category → items map + sorted categories

  server/
    actions.ts                 # Barrel re-export of all server actions
    inventory.ts               # getInventory() + revalidateInventory() + getDashboardData()
    mutations.ts               # requestUnit() + returnUnit() + returnUnits() + transferUnit()
    auth.ts                    # verifyPin() server action (timing-safe PIN comparison)
    google.ts                  # Google Sheets API client setup

  proxy.ts                     # Edge proxy (JWT verification, Next.js 16 convention)

  __tests__/                   # Vitest test suites
    setup.ts                   # Test environment setup (jsdom + jest-dom)
    constants.test.ts          # Column index and form constant tests
    form-utils.test.ts         # Requestor/FOC type resolution tests
    device-utils.test.ts       # Device category classification tests
```

### Module Responsibilities

| Module | Responsibility |
|---|---|
| `server/inventory.ts` | Fetches and transforms data from Google Sheets using **positional column parsing** (`STEP1_COLS`, `STEP3_COLS`, `STEP4_COLS`); cached with 60s ISR |
| `server/mutations.ts` | Appends rows to "Step 3" (request), "Step 4" (return), and handles direct transfers; formula injection sanitization; email notifications; batch size limits |
| `lib/mailer.ts` | `sendFocNotification()` / `sendFocBatchNotification()` — sends styled HTML email via Nodemailer + Gmail SMTP on every mutation; threads all emails into a single Gmail conversation |
| `server/auth.ts` | PIN verification with timing-safe comparison, JWT signing, cookie management |
| `types/inventory.ts` | `InventoryItem`, `Step1Data`, `Step3RefData`, `KOLProfile`, `ActionResult` type definitions |
| `lib/constants.ts` | Centralized constants: `STEP1_COLS`, `STEP3_COLS`, `STEP4_COLS`, `REQUESTORS`, `FOC_TYPES`, `DELIVERY_TYPES`, `CAMPAIGNS`, `DEVICE_CATEGORIES`, `FOC_TYPE_KEYS`, sheet names, column headers |
| `lib/form-utils.ts` | `resolveRequestorWithFallback()`, `resolveFocTypeWithMatch()` — shared form data resolution |
| `lib/device-utils.ts` | Shared device helpers: `getDeviceCategory()`, `getCategoryIcon()`, `extractFocType()` |
| `lib/date-utils.ts` | `getReturnUrgency()`, `isItemOverdue()`, `isEmptyValue()` — shared date/urgency logic |
| `lib/validations.ts` | Zod schemas shared between client forms and server actions (request, return, transfer) |
| `lib/auth.ts` | `isAuthenticated()` — shared JWT verification for pages and actions (requires `JWT_SECRET`) |
| `hooks/useDeviceCategories.ts` | `useDeviceCategories(items, filterFn)` — builds category map, sorted categories, and filtered items |
| `hooks/useScrollToFirstError.ts` | `useScrollToFirstError()` — shared `onInvalid` handler that scrolls to and focuses the first error field |
| `hooks/useInventoryStats.ts` | Derives `totalStock`, `availableCount`, `onKolCount`, `giftedUnitsCount`, `availableUnits`, `loanedItems`, `topUrgentReturns`, `recentActivity` from raw inventory (single-pass) |
| `hooks/useSyncInventory.ts` | Centralized `handleSync()` + `isPending` state for all pages |

---

## Data Model

### Google Sheets Integration

Data is sourced from the sheet named **"Step 1 Data Bank"**, columns A through P.

The `getInventory()` server action reads the sheet and maps each row to the `InventoryItem` interface using **positional column parsing**:

| Field | Sheet Column | Index (`STEP1_COLS`) |
|---|---|---|
| `imei` | SERIAL NUMBER (IMEI/SN) | `STEP1_COLS.IMEI` (4) |
| `unitName` | UNIT NAME | `STEP1_COLS.UNIT_NAME` (5) |
| `focStatus` | FOC STATUS | `STEP1_COLS.FOC_STATUS` (6) |
| `plannedReturnDate` | PLANNED RETURN DATE | `STEP1_COLS.PLANNED_RETURN` (7) |
| `seinPic` | SEIN PIC NAME | `STEP1_COLS.SEIN_PIC_NAME` (2) |
| `goatPic` | GOAT PIC (PLANNER) | `STEP1_COLS.GOAT_PIC` (9) |
| `campaignName` | CAMPAIGN NAME | `STEP1_COLS.CAMPAIGN_NAME` (10) |
| `statusLocation` | STATUS LOCATION | `STEP1_COLS.STATUS_LOCATION` (12) |
| `onHolder` | ON HOLDER | `STEP1_COLS.ON_HOLDER` (13) |

Column lookups use **positional indices** defined in `STEP1_COLS`, `STEP3_COLS`, `STEP4_COLS` (in `lib/constants.ts`), validated against the FOC.xlsx spreadsheet structure. This replaces the previous header-name matching approach with a deterministic, index-based parser (`cell(row, index)`) that is faster and immune to header renames.

The legacy `COLUMN_HEADERS` header-name lookup is still exported but deprecated — it exists only for backward compatibility with `fullData`.

### Typed Step Data

Every `InventoryItem` now includes:

- **`step1Data: Step1Data`** — Typed column data from "Step 1 Data Bank" with named fields (e.g., `step1Data.imei`, `step1Data.focType`, `step1Data.statusLocation`).
- **`step3Data: Step3RefData | null`** — Cross-referenced data from "Step 3 FOC Request", matched by IMEI or composite key (UnitName||KOL). Provides `requestor`, `kolPhone`, `kolAddress`, `typeOfFoc`, etc.
- **`fullData: Record<string, string>`** — Deprecated backward-compat dictionary for QuickView panel.

### Dynamic Full Data

Every row also generates a `fullData` dictionary keyed by header names. This powers the `QuickViewPanel`, which renders all columns dynamically. Hidden/irrelevant columns are filtered using `QUICKVIEW_HIDDEN_KEYS` from `lib/constants.ts`.

### Real-time Caching and Revalidation

- `getInventory()` is wrapped in `unstable_cache` with a 60-second TTL (configured via `CACHE_REVALIDATE_SECONDS` in constants).
- Pages use **ISR** (`revalidate = 60`) instead of `force-dynamic` for better Vercel free-tier compatibility.
- `getDashboardData()` combines `getInventory()`, `getOverdueData()`, and `getReturnHistory()` into a single `Promise.all` call.
- Mutations immediately fire `revalidatePath('/', 'layout')` to drop the cache.
- The request-date cross-reference reads **"Step 3 FOC Request"** to resolve timestamps per device.

---

## Authentication and Security

### Flow

1. User enters a 6-digit PIN via `PinModal`.
2. `verifyPin()` (in `server/auth.ts`) checks against `AUTHORIZED_PINS` using timing-safe comparison.
3. On success, a JWT is signed (using `JWT_SECRET` from env) and set as HTTP-only cookie (`foc_auth_token`).
4. The edge proxy (`src/proxy.ts`) intercepts all routes and verifies the JWT. This is the **Next.js 16 approach** — the `proxy()` export replaces the legacy `middleware.ts` pattern.
5. Server actions independently verify authentication before processing mutations.

### Rate Limiting

Failed PIN attempts are tracked per-IP by `lib/rate-limit.ts`. After exceeding the maximum (5 attempts), the user is locked out for 15 minutes. The rate limit key is derived from the `x-forwarded-for` header.

### Security Properties

- **`JWT_SECRET` is required** — The application will reject all auth if `JWT_SECRET` is not set in the environment. There is no fallback.
- **HTTP-only cookies** — JWT cannot be accessed by client-side JavaScript.
- **`secure` flag** — Cookie is HTTPS-only in production.
- **`sameSite: "lax"`** — Prevents cross-site request attachment.
- **Server action auth gates** — Mutations reject unauthenticated callers.

---

## Email Notifications

Every FOC mutation (Request, Return, Transfer) triggers an email notification to the admin via `lib/mailer.ts`.

### Configuration

Add these environment variables to `.env.local`:

```env
EMAIL_USER="your-gmail@gmail.com"
EMAIL_PASS="your-app-password"
ADMIN_EMAIL="admin@wppmedia.com"
```

- Use a [Gmail App Password](https://myaccount.google.com/apppasswords), not your regular Gmail password.
- If any of these variables are missing, the system logs a warning and skips the notification — **the mutation still succeeds**.

### How It Works

1. After a successful Google Sheets write, the mutation calls `await sendFocNotification(data)` inside a try-catch.
2. The email uses a **static subject** (`📱 FOC Tracker Log - System Notifications`) so all notifications thread into a **single Gmail conversation**.
3. Gmail threading headers are injected into every email:
   - `messageId` — Unique per email (`<timestamp-random@wppmedia.com>`)
   - `inReplyTo` — Points to the static thread ID (`<foc-tracker-main-thread@wppmedia.com>`)
   - `references` — Contains the static thread ID
4. An HTML email is sent via Gmail SMTP with:
   - Color-coded action badge (blue = REQUEST, green = RETURN, yellow = TRANSFER)
   - Data table with unit name, IMEI, KOL, requestor, and timestamp
   - Optional `additionalData` fields (campaign, delivery date, etc.)
5. For batch returns (`returnUnits`), a single `sendFocBatchNotification()` email is sent with stacked cards for all items (max 50 items per batch).

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
- **`useDeviceCategories` hook** — Shared hook replacing duplicated category-map building in Request and Transfer forms.
- **Avoid render-time state updates** — Use `useEffect` when resetting `currentPage` or similar derived state, not inline during render.
- **Stable React keys** — Use composite keys (`${item.imei}-${item.unitName}-${idx}`) instead of array indices.

### Error Handling

- **Form submissions** — All server action calls in form modals (`RequestFormModal`, `ReturnFormModal`, `TransferFormModal`) are wrapped in `try/catch` to handle network-level failures with user-friendly toast messages.
- **PinModal** — Shows a loading spinner overlay during authentication and catches network errors.
- **Global error boundary** — `src/app/error.tsx` provides a retry UI for unhandled errors.
- **Batch mutations** — `returnUnits()` validates batch size (max 50) and provides descriptive errors on write failures.

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

## How-To Guides: Form & Content Customization

The following guides explain how to make common changes to the Request/Return forms, device categories, delivery options, and other site content **without breaking the application**.

---

### How to Add or Remove a Requestor

Requestors appear in the "Requestor" dropdown on both the Outbound (Request) and Inbound (Return) forms.

**File to edit:** `src/lib/constants.ts`

**Steps:**

1. Open `src/lib/constants.ts`.
2. Locate the `REQUESTORS` array:

   ```ts
   export const REQUESTORS = [
     "Abigail", "Aliya", "Khalida", "Oliv", "Sulu", "Tashya", "Venni", "Other",
   ] as const;
   ```

3. Add, remove, or rename entries.
4. **Keep `"Other"` last** — it triggers a conditional "Custom Requestor" text input below the dropdown.
5. Save the file. All forms will update automatically.

> **Note:** The `resolveRequestorWithFallback()` function in `lib/form-utils.ts` handles case-insensitive matching against this array. No backend or validation changes are needed — the Zod schema only requires `requestor` to be a non-empty string.

---

### How to Add or Remove a Campaign

Campaigns appear in the "Campaign Name" dropdown on the Outbound (Request) form and the "Transfer Reason / Campaign" dropdown on the Transfer form.

**File to edit:** `src/lib/constants.ts`

**Steps:**

1. Open `src/lib/constants.ts`.
2. Locate the `CAMPAIGNS` array.
3. Add, remove, or rename entries in the array.
4. **Keep `"Other"` last** — it triggers a conditional "Custom Campaign Name" text input.
5. Save the file. All forms will update automatically.

---

### How to Add or Remove a Device Category

Device categories control the first dropdown in the 2-step unit selection ("Select Device Category").

**File to edit:** `src/lib/constants.ts`

**Steps:**

1. Locate the `DEVICE_CATEGORIES` array:

   ```ts
   export const DEVICE_CATEGORIES = [
     { prefix: "G-S", label: "S Series", icon: "📱" },
     { prefix: "G-A", label: "A Series", icon: "📱" },
     { prefix: "G-T", label: "Tab",      icon: "📋" },
     { prefix: "G-B", label: "Buds",     icon: "🎧" },
     { prefix: "G-W", label: "Wearable", icon: "⌚" },
   ] as const;
   ```

2. Add a new object for a new category:

   ```ts
   { prefix: "G-R", label: "Rugged", icon: "🛡️" },
   ```

3. Or remove an existing entry to merge it into "Others".

**How it works:** The `prefix` is matched against the start of each item's `unitName` (after uppercasing). If no prefix matches, the unit falls into the automatic "Others" bucket. The `label` is what appears in the dropdown, and `icon` is the emoji shown next to it. The category grouping is handled by the shared `useDeviceCategories` hook.

---

### How to Add or Remove Delivery Types

Delivery types appear in the "Type of Delivery" dropdown on the Request form.

**File to edit:** `src/lib/constants.ts`

**Steps:**

1. Locate the `DELIVERY_TYPES` array.
2. Add or remove entries.
3. Save and test. No backend changes needed.

---

### How to Add or Remove FOC Types

FOC Types appear in the "Type of FOC" dropdown on both the Request and Return forms. This field can be **auto-filled** from the Google Sheet data (Column D of "Step 1 Data Bank"), but the user can still override the selection.

**File to edit:** `src/lib/constants.ts`

**Steps:**

1. Locate the `FOC_TYPES` array.
2. Add, remove, or rename entries.
3. If Google Sheets Column D uses a value not in this array, the auto-fill will set it but it may not match a dropdown option. Make sure the sheet values match the array entries (case-insensitive matching is handled by `resolveFocTypeWithMatch()` in `lib/form-utils.ts`).

---

### How to Change the Email Domain

The email domain suffix shown next to the Username field (currently `@wppmedia.com`).

**File to edit:** `src/lib/constants.ts`

Change the canonical value:

```ts
export const EMAIL_DOMAIN = "@newdomain.com";
```

The shared `UsernameEmailInput` component and `mutations.ts` both read from this constant — no other files need updating.

---

### How to Change Form Field Layout

The Request form layout is defined in `src/components/forms/RequestFormModal.tsx` and its sub-components in `src/components/forms/request/`.

The main grid uses a **2-column CSS grid** (`grid-cols-1 md:grid-cols-2`). To change the order of field groups, rearrange the sub-component tags in `RequestFormModal.tsx`:

```tsx
<RequestFormCampaign />
<RequestFormDevice ... />
<RequestFormKol />
<RequestFormDelivery ... />
```

The Transfer form follows the same pattern with sub-components in `src/components/forms/transfer/`:

```tsx
<UsernameEmailInput />
<TransferFormDevice ... />
<TransferFormDetails />
<TransferFormNewKol />
```

To change individual fields within a group, edit the corresponding sub-component file. Each `<FormItem>` can use `className="md:col-span-2"` to take up the full width or omit it to take up a single column.

---

### How to Add a Completely New Form Field

Adding a new field requires changes in **3 files**:

#### 1. Zod Schema — `src/lib/validations.ts`

Add the field to both the client schema and the payload schema:

```tsx
// Client schema (requestFormSchema)
newFieldName: z.string().min(1, "Field is required"),

// Server payload schema (requestPayloadSchema)
newFieldName: z.string().min(1, "Field is required"),

// Type (auto-inferred by z.infer, no manual change needed)
```

#### 2. Form UI — the relevant form sub-component

Add a default value in the `useForm` setup (in the parent modal), then add the `<FormField>` JSX in the desired sub-component.

#### 3. Server Action — `src/server/mutations.ts`

Add the new field to the row array that gets appended to Google Sheets. Find the mutation function and locate the `values` array:

```tsx
await writeToNextRow(SHEETS.FOC_REQUEST, [[
    timestamp,
    emailAddress,
    // ... existing fields
    validated.newFieldName,      // ← Add the new field here
]]);
```

> **Important:** The position in the array must match the target column in the Google Sheet. Refer to `STEP3_COLS` in `lib/constants.ts` for the exact column positions.

---

### How to Change the PIN / Add Authorized PINs

**File to edit:** `.env.local`

```env
AUTHORIZED_PINS="newpin1,newpin2,newpin3"
```

PINs are comma-separated strings. Restart the dev server after changing.

---

### How to Change the Sidebar / Navigation

**File to edit:** `src/components/layout/DashboardLayout.tsx`

The sidebar renders a list of navigation items using Lucide React icons. Each item has:
- `href` — the route path
- `icon` — a Lucide React icon component
- `label` — the visible text

Search for the navigation items and add/modify entries:

```tsx
<NavItem href="/new-page" icon={<SomeIcon className={...} />} label="New Page" active={pathname.startsWith("/new-page")} open={open} />
```

Then create the corresponding page at `src/app/new-page/page.tsx`.

---

### How to Change Dashboard Scorecard Content

**File to edit:** `src/components/dashboard/DashboardClient.tsx`

Scorecards are rendered using the `<Scorecard>` component. Each one receives:
- `title` — card heading
- `value` — the number to display
- `icon` — Lucide icon
- `filterLink` — optional link URL for click-through

Modify the props or add new `<Scorecard>` instances in the grid.

---

### How to Modify Google Sheet Column Mapping

If the Google Sheet columns are renamed or reordered:

**File to edit:** `src/lib/constants.ts`

Update the positional index constants (`STEP1_COLS`, `STEP3_COLS`, `STEP4_COLS`):

```tsx
export const STEP1_COLS = {
  IMEI: 4,          // Column E
  UNIT_NAME: 5,      // Column F
  // ... update indices as needed
} as const;
```

Also update the corresponding `Step1Data` / `Step3RefData` interfaces in `types/inventory.ts` and the parser functions in `server/inventory.ts`.

> **Legacy:** The `COLUMN_HEADERS` header-name lookup still exists but is deprecated. Positional parsing is the preferred approach.

---

### How to Add Firebase, Supabase, or Other Backends

The application currently uses Google Sheets as its only data source. To add a different backend:

1. Create a new service file in `src/server/` (e.g., `supabase.ts`).
2. Implement the same `getInventory()` return shape (`InventoryItem[]`).
3. Replace the import in `src/server/inventory.ts`.
4. Update mutation functions in `src/server/mutations.ts` to write to the new backend.
5. Keep the Zod schemas unchanged — they validate the data shape, not the storage layer.

---

## Troubleshooting

**Sheet column headers changed** — Update the positional index in `STEP1_COLS`, `STEP3_COLS`, or `STEP4_COLS` in `lib/constants.ts`. Also update the corresponding `Step1Data` / `Step3RefData` interface in `types/inventory.ts`.

**Google API 429 errors** — The cache TTL is 60 seconds. Adjust `CACHE_REVALIDATE_SECONDS` in `lib/constants.ts` if needed.

**Missing KOL entries** — The KOL directory groups by the `ON HOLDER` field. Inconsistent spelling in the sheet creates duplicate profiles.

**Build fails with missing env vars** — All three Google credentials must be present. `JWT_SECRET` is required for authentication. `AUTHORIZED_PINS` must also be set.

**Adding a new hidden column to QuickView** — Add the lowercase key to `QUICKVIEW_HIDDEN_KEYS` in `lib/constants.ts`.

**Form submission goes to wrong row** — The server uses `INSERT_ROWS` with explicit range targeting. Check `server/mutations.ts` to verify the range logic.

**Auto-fill FOC Type not working** — Ensure the Column D index matches `STEP1_COLS.FOC_TYPE` (3) in `lib/constants.ts`. The `resolveFocTypeWithMatch()` function in `lib/form-utils.ts` handles case-insensitive matching.

**"Server misconfigured — JWT_SECRET is not set" error** — The `JWT_SECRET` environment variable is required. Add it to `.env.local` and restart the dev server.

**Email notifications not sending** — Check that `EMAIL_USER`, `EMAIL_PASS`, and `ADMIN_EMAIL` are set in `.env.local`. Use a [Gmail App Password](https://myaccount.google.com/apppasswords), not your regular password. Check server logs for `[MAILER]` prefixed messages. If env vars are missing, notifications are skipped silently — the mutation still succeeds.

**Emails not threading in Gmail** — Verify the `THREAD_ID` constant in `lib/mailer.ts` is set to `<foc-tracker-main-thread@wppmedia.com>`. All emails share `inReplyTo` and `references` headers pointing to this ID.

---

## Shared Components & Hooks

### DiscardGuardDialog
`src/components/shared/DiscardGuardDialog.tsx` — Reusable "Discard changes?" confirmation dialog used by all three form modals. Replaces the previous 3x duplicated AlertDialog pattern.

### UsernameEmailInput
`src/components/forms/shared/UsernameEmailInput.tsx` — Reusable username input with `EMAIL_DOMAIN` suffix. Uses `useFormContext()` to integrate with any parent form. Replaces 3x duplicated email suffix inputs.

### PageHeader
`src/components/shared/PageHeader.tsx` — Unified header toolbar rendered on Dashboard, Inventory, and KOL pages. Contains:
- Theme toggle
- Sync button (uses `useSyncInventory` hook)
- Cmd+K search trigger
- Return and Request form modals

### CommandPalette
`src/components/shared/CommandPalette.tsx` — Global search accessible via `Ctrl+K` / `⌘K` or `/`. Searches across:
- Page navigation (Dashboard, Inventory, KOL)
- Quick filters (Available, Loaned, Unreturned)
- KOL names (first 10 matches)
- Campaign names (first 8 matches)

### useDeviceCategories
`src/hooks/useDeviceCategories.ts` — Shared hook that builds a category → items map, sorted category list, and filtered items from a flat `InventoryItem[]` and a filter function. Used by both `RequestFormModal` and `TransferFormModal`.

### useScrollToFirstError
`src/hooks/useScrollToFirstError.ts` — Shared `onInvalid` handler for react-hook-form that smooth-scrolls to and focuses the first error field. Replaces 3x duplicated scroll-to-error logic.

### useSyncInventory
`src/hooks/useSyncInventory.ts` — Centralized hook for triggering a manual cache-bust sync with Google Sheets. Returns `{ isPending, handleSync }`. Uses `useTransition` for non-blocking UI updates.

### useInventoryStats
`src/hooks/useInventoryStats.ts` — Derives all dashboard-level statistics from the raw inventory array. Returns: `totalStock`, `availableCount`, `onKolCount`, `giftedUnitsCount`, `pendingReturnCount`, `availableUnits`, `loanedItems`, `topUrgentReturns`, `recentActivity`.

### DashboardDonutChart
`src/components/dashboard/DashboardDonutChart.tsx` — Pure SVG donut chart replacing the heavy `recharts` dependency. Zero external dependencies. Renders animated SVG arcs with a center label.

---

## Testing

The project uses **Vitest** with `jsdom` environment and React Testing Library.

### Running Tests

```bash
pnpm test          # single run
pnpm test:watch    # watch mode
```

### Test Files

| File | Coverage |
|---|---|
| `src/__tests__/constants.test.ts` | Column indices (`STEP1_COLS`, `STEP3_COLS`, `STEP4_COLS`), form constants, status values |
| `src/__tests__/form-utils.test.ts` | `resolveRequestorWithFallback()`, `resolveFocTypeWithMatch()` |
| `src/__tests__/device-utils.test.ts` | `getDeviceCategory()` classification |

### Adding Tests

New test files go in `src/__tests__/`. Import from `@/` aliases (configured in `vitest.config.ts`). Use `@testing-library/jest-dom/vitest` matchers (auto-loaded via `setup.ts`).

---

## Future Development TODOs

The following improvements are planned but not yet implemented:

### UI/UX Improvements
- [x] **Form Discard Confirmation** — Show "Discard changes?" dialog when closing a dirty form (`isDirty` from react-hook-form)
- [x] **Scroll-to-Error** — On form validation failure, smooth-scroll to the first error field
- [ ] **Dashboard Date Range Filter** — Add date range selector to filter dashboard analytics by time period
- [x] **Multi-Unit Return** — Select multiple loaned devices in the Inbound (Return) form; per-item data auto-resolved from Step 3 sheet
- [ ] **Bulk Operations** — Multi-select rows in Master List for batch status updates
- [ ] **Notification System** — Toast-based alerts for overdue returns and approaching deadlines

### Code Quality
- [x] **Component Decomposition** — Break down large components:
  - [x] `RequestFormModal.tsx` → extracted step sections into `RequestFormCampaign`, `RequestFormDevice`, `RequestFormKol`, `RequestFormDelivery`
  - [x] `TransferFormModal.tsx` → extracted into `TransferFormDevice`, `TransferFormDetails`, `TransferFormNewKol`
  - [x] `ModelsTab.tsx` → extracted level views into `ModelLevel1Grid`, `ModelLevel2Cards`, `ModelLevel3Units`
  - [x] `ReturnFormModal.tsx` → extracted IMEI selector into `MultiImeiReturnSelector` (multi-select)
  - [x] `MasterListTab.tsx` → extracted mobile card view and pagination into sub-components
- [x] **Shared Device Utilities** — Extracted `getDeviceCategory()`, `getCategoryIcon()`, `extractFocType()` to `lib/device-utils.ts`
- [x] **Shared Form Utilities** — Extracted `resolveRequestorWithFallback()`, `resolveFocTypeWithMatch()` to `lib/form-utils.ts`
- [x] **Shared Form Components** — `DiscardGuardDialog`, `UsernameEmailInput` eliminate 3x duplication across form modals
- [x] **Shared Hooks** — `useDeviceCategories`, `useScrollToFirstError` eliminate duplicated logic
- [x] **Consolidated Stats Hook** — Single-pass `useInventoryStats` with `parseDateStr` for reliable sorting
- [x] **Unit Tests** — Vitest setup with 23 tests covering constants, form-utils, and device-utils
- [x] **Positional Column Parsing** — Replaced header-name matching with `STEP1_COLS`/`STEP3_COLS`/`STEP4_COLS` index constants + `cell(row, idx)` parser
- [ ] **React.memo optimization** — Memoize expensive child components (Scorecard, table rows)

### Security
- [x] **Per-IP Rate Limiting** — Rate limit key derived from `x-forwarded-for` header instead of global key
- [x] **Timing-Safe PIN Comparison** — Prevents timing attacks on PIN verification
- [x] **Formula Injection Protection** — `sanitizeCell()` prefixes `=`, `+`, `-`, `@` with apostrophe before writing to Sheets
- [x] **Required JWT_SECRET** — No fallback to `GOOGLE_PRIVATE_KEY`; application rejects auth without it
- [x] **Race Condition Fix** — `writeToNextRow` uses `values.append` + `INSERT_ROWS` instead of read-then-write
- [x] **Accessible Interactive Elements** — Keyboard support (`role="button"`, `tabIndex`, `onKeyDown`) on clickable divs

### Features
- [x] **Email Notifications** — Nodemailer + Gmail SMTP sends styled HTML emails on every Request, Return, and Transfer
- [x] **Gmail Thread Grouping** — Static subject + `In-Reply-To`/`References` headers thread all notifications into a single conversation
- [x] **Batch Email** — `sendFocBatchNotification()` sends one email with stacked cards for multi-unit returns
- [x] **Error/Loading/Not-Found Pages** — Global `error.tsx`, `not-found.tsx`, and `loading.tsx` on all routes
- [x] **Icon Standardization** — Migrated from `@tabler/icons-react` to Lucide React exclusively
- [x] **ISR Caching** — Switched from `force-dynamic` to `revalidate = 60` for Vercel free-tier compatibility
- [ ] **Role-Based Access Control** — Different permission levels (admin vs. viewer)
- [ ] **Internationalization (i18n)** — Support for Bahasa Indonesia alongside English
- [ ] **PWA Offline Mode** — Cache critical data for offline dashboard viewing
- [ ] **QR Code Generation** — Generate QR codes for device IMEI labels
- [ ] **Export Reports** — Generate PDF/Excel reports for inventory audits
- [ ] **Activity Audit Log** — Persistent log of all form submissions with timestamps
