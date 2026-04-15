# agents.md — Hubz FOC Tracker

> AI coding agent rules, conventions, and context for Cursor, Copilot, Windsurf, and other AI code editors.
> Place this file in your project root as `agents.md` or `.cursorrules`.

---

## Project Identity

**Purpose:** Internal analytics dashboard and logistics tracking portal for managing Free-of-Charge (FOC) device loan lifecycles for KOL (Key Opinion Leader) marketing operations.

**Stack:** Next.js 16 App Router + React 19 | Tailwind CSS v4 | Shadcn UI | Framer Motion | Google Sheets API | Supabase + Drizzle ORM | jose JWT | Nodemailer + Gmail | Vitest | pnpm

**Business Glossary:**
- FOC: Free-of-Charge device loan given to a KOL
- KOL: Key Opinion Leader (influencer/reviewer)
- IMEI/SN: Device serial identifier
- Step 1 Data Bank: Primary Google Sheet tab (inventory)
- Step 3 FOC Request: Outbound loan request sheet tab
- Step 4: Return records sheet tab
- SEIN PIC: Internal Samsung point-of-contact
- GOAT PIC: Planner/coordinator role
- FOC Status: "Return" (returned) | "Unreturn" (still on loan)

---

## Architecture Rules

### App Router Conventions
- ALL pages in `src/app/`. NEVER use `src/pages/` (legacy router, not used).
- Server Components by default. Add `"use client"` only for state/effects/browser APIs.
- Data fetching via Server Actions in `src/server/`, NOT via client-side fetch().
- Mutations → `src/server/mutations.ts`
- Reads → `src/server/inventory.ts`
- Auth actions → `src/server/auth.ts`
- Settings CRUD → `src/app/actions/settings.ts`

### Import Aliases
- ALWAYS use `@/` alias. Never use relative imports more than 1 level deep.

### Server vs Client Boundary
- NEVER import Google Sheets client, Drizzle, or Nodemailer in client components.
- The Edge proxy is `src/proxy.ts` (Next.js 16). Do NOT use middleware.ts.

### Caching
- `getInventory()` uses `unstable_cache` with 60s TTL.
- Pages use `export const revalidate = 60` (ISR), NOT `force-dynamic`.
- After ANY mutation: call `revalidatePath('/', 'layout')`.

---

## Data Layer Rules

### Google Sheets
- Primary data source. NEVER write FOC inventory to Supabase.
- Always use `SHEETS` constant for sheet names. Never hardcode strings.
- Column parsing: use STEP1_COLS, STEP3_COLS, STEP4_COLS index constants.
- NEVER use header-name matching (COLUMN_HEADERS is deprecated).
- Use `cell(row, index)` helper for reading cells.
- ALWAYS use `sanitizeCell()` before writing user input to Sheets.
- Use `writeToNextRow()` for all appends. NEVER read-then-write.

### Supabase / Drizzle
- ONLY for cc_recipients (Settings page). NOT for FOC inventory.
- Schema in `src/db/schema.ts`. Run `npx drizzle-kit push` after changes.
- Queries in server actions / server components only.

### Types
- Inventory: `InventoryItem` | Step data: `Step1Data`, `Step3RefData`
- NEVER use `any` for inventory data.
- `fullData: Record<string, string>` is deprecated — do NOT use in new code.

### Zod + ActionResult
- ALL mutations validated by Zod schemas in `src/lib/validations.ts`.
- Same schema for client (react-hook-form) and server validation.
- ALL server actions return `ActionResult<T>` = `{ success: true; data: T } | { success: false; error: string }`
- NEVER throw from a server action.

---

## Component Rules

### Always Use These Shared Components
- PageHeader — for ALL page toolbars
- Scorecard — for KPI cards
- EmptyState — for zero-data states
- QuickViewPanel — for device detail slide-over
- DiscardGuardDialog — for ALL forms with dirty state
- CommandPalette — extend this, never duplicate search

### Icons
- ONLY Lucide React. NOT @tabler/icons-react.
- Sizes: w-4 h-4 (sm) | w-5 h-5 (md) | w-6 h-6 (lg)

### Animations (Framer Motion)
- Entry: `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`
- Duration: 200–300ms. Stagger: 0.05s. Max hover scale: scale-[1.01]

### React.memo
- Memoize: Scorecard, table rows, KOL profile cards.

---

## Forms & Mutations

### Adding a New Form Field
1. Add to Zod schema in `validations.ts`
2. Add to `defaultValues` in useForm
3. Add `<FormField>` JSX in sub-component
4. Add value to `values` array in mutation (matching column position)
5. Update STEP*_COLS if new sheet column added

### Form Rules
- ALWAYS use DiscardGuardDialog when isDirty = true
- ALWAYS attach useScrollToFirstError as onInvalid handler
- Multi-unit returns: use MultiImeiReturnSelector + sendFocBatchNotification

---

## Auth & Security Rules

### NEVER Violate
- NEVER expose JWT_SECRET in client code or NEXT_PUBLIC_ vars
- NEVER skip isAuthenticated() in mutations
- NEVER skip sanitizeCell() before Sheets writes
- NEVER log JWTs, PINs, or Google credentials
- NEVER use non-timing-safe PIN comparison
- HTTP-only cookie MUST be true. secure flag MUST be true in production.

### Rate Limiting
- 5 failed attempts → 15-min lockout per IP
- Extend `lib/rate-limit.ts`. Do NOT add a second rate-limiter.

---

## Style & Theming

### Tailwind v4
- Utility classes only. Custom CSS only for design tokens in `globals.css`.
- Glassmorphism: `backdrop-blur-xl bg-white/5 border border-white/10`
- NEVER hardcode `text-black` / `bg-white` — use semantic theme classes.

### Colors
- Good/available: green | Warning/pending: yellow | Error/overdue: red | Accent: violet

### Typography
- Page title: text-2xl/3xl font-bold | Section: text-xl font-semibold
- Card title: text-sm font-semibold | Body: text-sm | Mono (IMEI): font-mono text-xs

---

## Testing Rules

- Test location: `src/__tests__/`
- Stack: Vitest + jsdom + React Testing Library
- NEVER make real API calls in tests — mock with vi.mock() or MSW
- Use vi.stubEnv() for env var mocking
- Run: `pnpm test` (single) | `pnpm test:watch` (watch mode)

---

## Forbidden Actions

### NEVER
- ❌ Delete Google Sheets rows (append only — deletions break IMEI cross-refs)
- ❌ Reorder sheet columns without updating STEP*_COLS constants
- ❌ Write unsanitized user input to Sheets
- ❌ Import Sheets/Drizzle/Nodemailer in client components
- ❌ Use pages/ directory (App Router project)
- ❌ Use middleware.ts (use proxy.ts instead)
- ❌ Use `any` for inventory types
- ❌ Use fullData field in new code (deprecated)
- ❌ Use recharts (use built-in SVG DonutChart)
- ❌ Use @tabler/icons-react (use Lucide React)
- ❌ Use npm or yarn (pnpm only)
- ❌ Hardcode sheet names (use SHEETS constants)
- ❌ Skip isAuthenticated() in mutations
- ❌ Cache sensitive data (PINs, JWTs) in unstable_cache
