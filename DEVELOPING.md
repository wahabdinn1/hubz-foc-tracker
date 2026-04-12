# Hubz FOC Tracker — Developer Guide

This document covers the architecture, data flow, conventions, security model, and **step-by-step guides for common customization tasks** (adding requestors, changing form fields, updating delivery types, etc.).

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
      PageHeader.tsx           # Unified page header toolbar (theme, sync, forms, Cmd+K)
      CommandPalette.tsx       # Global Cmd+K search across nav, KOLs, campaigns
      QuickViewPanel.tsx       # Slide-over device detail panel
      Scorecard.tsx            # Animated stat card with spotlight effect
      PinModal.tsx             # Authentication PIN lock screen
      ErrorBoundary.tsx        # React error boundary with retry UI
      Skeletons.tsx            # Loading skeleton components
     forms/                     # Data-entry modals
       RequestFormModal.tsx     # Outbound (loan) request form
       ReturnFormModal.tsx      # Inbound (return) form
       TransferFormModal.tsx    # Direct transfer between KOLs
       ImeiReturnSelector.tsx   # Reusable IMEI combobox for return form
       request/                 # Request form sub-components
         RequestFormCampaign.tsx
         RequestFormDevice.tsx
         RequestFormKol.tsx
         RequestFormDelivery.tsx
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
                               #   InventoryItem, ReturnTrackingItem,
                               #   KOLProfile, ActionResult

  lib/
    auth.ts                    # Shared server-side JWT verification
    constants.ts               # Centralized constants: REQUESTORS, FOC_TYPES,
                               #   DELIVERY_TYPES, CAMPAIGNS, DEVICE_CATEGORIES,
                               #   FOC_TYPE_KEYS, sheet names, column headers, auth config, etc.
    device-utils.ts            # Shared device helpers: getDeviceCategory(), getCategoryIcon(), extractFocType()
    date-utils.ts              # Shared date/urgency helpers
    validations.ts             # Centralized Zod schemas (request + return + transfer)
    utils.ts                   # Tailwind class merge & helpers
    rate-limit.ts              # In-memory per-IP PIN brute-force prevention

  hooks/
    useInventoryStats.ts       # Derives stats (available, loaned, etc.) from inventory
    useSyncInventory.ts        # Centralized sync-with-Sheets + transition state

  server/
    actions.ts                 # Barrel re-export of all server actions
    inventory.ts               # getInventory() + revalidateInventory()
    mutations.ts               # requestUnit() + returnUnit() + transferUnit()
    auth.ts                    # verifyPin() server action (timing-safe PIN comparison)
    google.ts                  # Google Sheets API client setup

  proxy.ts                     # Edge proxy (JWT verification, Next.js 16 convention)
```

### Module Responsibilities

| Module | Responsibility |
|---|---|
| `server/inventory.ts` | Fetches and transforms data from Google Sheets; cached with 30s TTL |
| `server/mutations.ts` | Appends rows to "Step 3" (request), "Step 4" (return), and handles direct transfers; formula injection sanitization |
| `server/auth.ts` | PIN verification with timing-safe comparison, JWT signing, cookie management |
| `types/inventory.ts` | `InventoryItem`, `ReturnTrackingItem`, `KOLProfile`, `ActionResult` type definitions |
| `lib/constants.ts` | Centralized constants: `REQUESTORS`, `FOC_TYPES`, `DELIVERY_TYPES`, `CAMPAIGNS`, `DEVICE_CATEGORIES`, `FOC_TYPE_KEYS`, sheet names, column headers |
| `lib/device-utils.ts` | Shared device helpers: `getDeviceCategory()`, `getCategoryIcon()`, `extractFocType()` |
| `lib/date-utils.ts` | `getReturnUrgency()`, `isItemOverdue()`, `isEmptyValue()` — shared date/urgency logic |
| `lib/validations.ts` | Zod schemas shared between client forms and server actions (request, return, transfer) |
| `lib/auth.ts` | `isAuthenticated()` — shared JWT verification for pages and actions (requires `JWT_SECRET`) |
| `hooks/useInventoryStats.ts` | Derives `totalStock`, `availableCount`, `onKolCount`, `giftedUnitsCount`, `availableUnits`, `loanedItems`, `topUrgentReturns`, `recentActivity` from raw inventory (single-pass) |
| `hooks/useSyncInventory.ts` | Centralized `handleSync()` + `isPending` state for all pages |

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
2. `verifyPin()` (in `server/auth.ts`) checks against `AUTHORIZED_PINS` using timing-safe comparison.
3. On success, a JWT is signed (using `JWT_SECRET` from env) and set as HTTP-only cookie (`foc_auth_token`).
4. The edge proxy (`src/proxy.ts`) intercepts all routes and verifies the JWT.
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

## How-To Guides: Form & Content Customization

The following guides explain how to make common changes to the Request/Return forms, device categories, delivery options, and other site content **without breaking the application**.

---

### How to Add or Remove a Requestor

Requestors appear in the "Requestor" dropdown on both the Outbound (Request) and Inbound (Return) forms.

**File to edit:** `src/components/forms/RequestFormModal.tsx` (Request) and `src/components/forms/ReturnFormModal.tsx` (Return)

**Steps:**

1. Open the form component file.
2. Search for the string array that populates the `<SelectItem>` elements inside the Requestor field. It looks like this:

   ```tsx
   {["Abigail", "Khalida", "Oliv", "Salma", "Tashya", "Venni", "Other"].map((req) => (
       <SelectItem key={req} value={req} ...>
           {req}
       </SelectItem>
   ))}
   ```

3. Add, remove, or rename entries inside the array:

   ```tsx
   // Example: Adding "Diana" and removing "Oliv"
   {["Abigail", "Diana", "Khalida", "Salma", "Tashya", "Venni", "Other"].map((req) => (
   ```

4. **Keep `"Other"` last** — it triggers a conditional "Custom Requestor" text input below the dropdown.
5. Repeat the same change in `ReturnFormModal.tsx` so both forms stay consistent.
6. Save and test with `pnpm dev`.

> **Note:** No backend or validation changes are needed. The Zod schema only requires `requestor` to be a non-empty string, it does not enforce specific values.

> **Centralized Constants:** Since the 2026-04 refactoring, all dropdown values are defined in `src/lib/constants.ts`. The forms import from there — you no longer need to edit each form file separately.

**Single source of truth (`src/lib/constants.ts`):**

```ts
export const REQUESTORS = ["Abigail", "Khalida", "Oliv", "Salma", "Tashya", "Venni", "Other"] as const;
```

Edit this array to add/remove requestors. Both forms will update automatically.

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

**File to edit:** `src/components/forms/RequestFormModal.tsx`

**Steps:**

1. Find the `DEVICE_CATEGORIES` constant at the top of the file:

   ```tsx
   const DEVICE_CATEGORIES = [
       { prefix: "G-S", label: "S Series", icon: "📱" },
       { prefix: "G-A", label: "A Series", icon: "📱" },
       { prefix: "G-T", label: "Tab",      icon: "📋" },
       { prefix: "G-B", label: "Buds",     icon: "🎧" },
       { prefix: "G-W", label: "Wearable", icon: "⌚" },
   ] as const;
   ```

2. Add a new object for a new category:

   ```tsx
   { prefix: "G-R", label: "Rugged", icon: "🛡️" },
   ```

3. Or remove an existing entry to merge it into "Others".

**How it works:** The `prefix` is matched against the start of each item's `unitName` (after uppercasing). If no prefix matches, the unit falls into the automatic "Others" bucket. The `label` is what appears in the dropdown, and `icon` is the emoji shown next to it.

> **Note:** Since the 2026-04 refactoring, `DEVICE_CATEGORIES` is defined in `src/lib/constants.ts` and imported by `RequestFormModal.tsx`. Edit the constant there.

---

### How to Add or Remove Delivery Types

Delivery types appear in the "Type of Delivery" dropdown on the Request form.

**File to edit:** `src/components/forms/RequestFormModal.tsx`

**Steps:**

1. Search for the delivery type array. It looks like:

   ```tsx
   {["BLUEBIRD", "TIKI"].map((type) => (
       <SelectItem key={type} value={type} ...>
           {type}
       </SelectItem>
   ))}
   ```

2. Add or remove entries:

   ```tsx
   {["BLUEBIRD", "GOSEND", "TIKI", "PICKUP"].map((type) => (
   ```

3. Save and test. No backend changes needed.

> **Note:** Since the 2026-04 refactoring, delivery types are defined in `src/lib/constants.ts` as `DELIVERY_TYPES`. Edit the constant there.

---

### How to Add or Remove FOC Types

FOC Types appear in the "Type of FOC" dropdown on both the Request and Return forms. This field can be **auto-filled** from the Google Sheet data (Column D of "Step 1 Data Bank"), but the user can still override the selection.

**File to edit:** `src/components/forms/RequestFormModal.tsx` and `src/components/forms/ReturnFormModal.tsx`

**Steps:**

1. Search for the FOC type array:

   ```tsx
   {["ACCESORIES", "APS", "BUDS", "HANDPHONE", "PACKAGES", "RUGGED", "TAB", "WEARABLES"].map((type) => (
   ```

2. Add, remove, or rename entries:

   ```tsx
   {["ACCESSORIES", "APS", "BUDS", "HANDPHONE", "PACKAGES", "RUGGED", "TAB", "WEARABLES", "MONITOR"].map((type) => (
   ```

3. If Google Sheets Column D uses a value not in this array, the auto-fill will set it but it may not match a dropdown option. Make sure the sheet values match the array entries (case-insensitive matching is handled by the `extractFocType` function).

> **Note:** Since the 2026-04 refactoring, FOC types are defined in `src/lib/constants.ts` as `FOC_TYPES`. Edit the constant there — both forms import from it.

---

### How to Change the Email Domain

The email domain suffix shown next to the Username field (currently `@wppmedia.com`).

**Files to edit:**

1. `src/lib/constants.ts` — Change the canonical value:

   ```tsx
   export const EMAIL_DOMAIN = "@newdomain.com";
   ```

2. `src/components/forms/RequestFormModal.tsx` — Update the visible suffix text:

   ```tsx
   <span className="...">@newdomain.com</span>
   ```

3. `src/server/mutations.ts` — The server action reads `EMAIL_DOMAIN` from constants, so updating `constants.ts` is sufficient for the backend.

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

To change individual fields within a group (e.g., swapping KOL Name and Phone), edit the corresponding sub-component file (e.g., `RequestFormKol.tsx`). Each `<FormItem>` can use `className="md:col-span-2"` to take up the full width or omit it to take up a single column.

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

#### 2. Form UI — `src/components/forms/RequestFormModal.tsx`

Add a default value in the `useForm` setup:

```tsx
defaultValues: {
    // ... existing fields
    newFieldName: "",
},
```

Add the JSX `<FormField>` block in the desired position within the grid:

```tsx
<FormField
    control={form.control}
    name="newFieldName"
    render={({ field }) => (
        <FormItem>
            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                New Field Label
            </FormLabel>
            <FormControl>
                <Input
                    placeholder="Enter value"
                    className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500"
                    {...field}
                />
            </FormControl>
            <FormMessage className="text-red-400" />
        </FormItem>
    )}
/>
```

#### 3. Server Action — `src/server/mutations.ts`

Add the new field to the row array that gets appended to Google Sheets. Find the `requestUnit` function and locate the `values` array:

```tsx
const values = [[
    timestamp,
    payload.username + EMAIL_DOMAIN,
    payload.requestor === "Other" ? payload.customRequestor : payload.requestor,
    payload.campaignName === "Other" ? payload.customCampaign : payload.campaignName,
    payload.unitName,
    payload.imeiIfAny || "",
    payload.kolName,
    payload.kolAddress,
    payload.kolPhoneNumber,
    payload.deliveryDate,
    payload.typeOfDelivery,
    payload.typeOfFoc,
    payload.newFieldName,      // ← Add the new field here
]];
```

> **Important:** The position in the array must match the target column in the Google Sheet. If the new field maps to Column N, place it as the 14th element (0-indexed: 13th).

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

The sidebar renders a list of navigation items. Each item has:
- `href` — the route path
- `icon` — a Lucide React icon component
- `label` — the visible text

Search for the navigation items array and add/modify entries:

```tsx
{ href: "/new-page", icon: SomeIcon, label: "New Page" },
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

Update the `COLUMN_HEADERS` object. Each key maps to an **ordered array** of possible header names:

```tsx
export const COLUMN_HEADERS = {
  IMEI: ["SERIAL NUMBER (IMEI/SN)", "IMEI", "Serial Number"],
  // ... add fallback names as needed
};
```

The system tries each name in order and uses the first match. This makes the app robust against minor header renames.

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

**Sheet column headers changed** — Update the corresponding entry in `lib/constants.ts` → `COLUMN_HEADERS`. The lookup system tries multiple header names in priority order.

**Google API 429 errors** — The cache TTL is 30 seconds. Adjust `CACHE_REVALIDATE_SECONDS` in `lib/constants.ts` if needed.

**Missing KOL entries** — The KOL directory groups by the `ON HOLDER` field. Inconsistent spelling in the sheet creates duplicate profiles.

**Build fails with missing env vars** — All three Google credentials must be present. `JWT_SECRET` is required for authentication. `AUTHORIZED_PINS` must also be set.

**Adding a new hidden column to QuickView** — Add the lowercase key to `QUICKVIEW_HIDDEN_KEYS` in `lib/constants.ts`.

**Form submission goes to wrong row** — The server uses `INSERT_ROWS` with explicit range targeting. Check `server/mutations.ts` to verify the range logic.

**Auto-fill FOC Type not working** — Ensure the Column D header in "Step 1 Data Bank" matches one of the keys in `FOC_TYPE_KEYS` array in `lib/constants.ts` (e.g., `"FOC TYPE"`, `"TYPE OF FOC"`, `"Type of Foc"`).

**"Server misconfigured — JWT_SECRET is not set" error** — The `JWT_SECRET` environment variable is required. Add it to `.env.local` and restart the dev server.

---

## Shared Components & Hooks

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

### useSyncInventory
`src/hooks/useSyncInventory.ts` — Centralized hook for triggering a manual cache-bust sync with Google Sheets. Returns `{ isPending, handleSync }`. Uses `useTransition` for non-blocking UI updates.

### useInventoryStats
`src/hooks/useInventoryStats.ts` — Derives all dashboard-level statistics from the raw inventory array. Returns: `totalStock`, `availableCount`, `onKolCount`, `giftedUnitsCount`, `pendingReturnCount`, `availableUnits`, `loanedItems`, `topUrgentReturns`, `recentActivity`.

### DashboardDonutChart
`src/components/dashboard/DashboardDonutChart.tsx` — Pure SVG donut chart replacing the heavy `recharts` dependency. Zero external dependencies. Renders animated SVG arcs with a center label.

---

## Future Development TODOs

The following improvements are planned but not yet implemented:

### UI/UX Improvements
- [x] **Form Discard Confirmation** — Show "Discard changes?" dialog when closing a dirty form (`isDirty` from react-hook-form)
- [x] **Scroll-to-Error** — On form validation failure, smooth-scroll to the first error field
- [ ] **Dashboard Date Range Filter** — Add date range selector to filter dashboard analytics by time period
- [ ] **Bulk Operations** — Multi-select rows in Master List for batch status updates
- [ ] **Notification System** — Toast-based alerts for overdue returns and approaching deadlines

### Code Quality
- [x] **Component Decomposition** — Break down large components:
  - [x] `RequestFormModal.tsx` → extracted step sections into `RequestFormCampaign`, `RequestFormDevice`, `RequestFormKol`, `RequestFormDelivery`
  - [x] `ModelsTab.tsx` → extracted level views into `ModelLevel1Grid`, `ModelLevel2Cards`, `ModelLevel3Units`
  - [x] `ReturnFormModal.tsx` → extracted IMEI selector into reusable component
  - [x] `MasterListTab.tsx` → extracted mobile card view and pagination into sub-components
- [ ] **React.memo optimization** — Memoize expensive child components (Scorecard, table rows)
- [ ] **Unit Tests** — Add test coverage for date-utils, validations, and server actions

### Features
- [ ] **Role-Based Access Control** — Different permission levels (admin vs. viewer)
- [ ] **Internationalization (i18n)** — Support for Bahasa Indonesia alongside English
- [ ] **PWA Offline Mode** — Cache critical data for offline dashboard viewing
- [ ] **QR Code Generation** — Generate QR codes for device IMEI labels
- [ ] **Export Reports** — Generate PDF/Excel reports for inventory audits
- [ ] **Activity Audit Log** — Persistent log of all form submissions with timestamps
