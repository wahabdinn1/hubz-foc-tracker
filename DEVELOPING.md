# Hubz FOC Tracker - Developing Guide

Welcome to the central development guide for the **Hubz FOC Tracker**. This document is intended to brief human developers on the architectural layout, specific data models, and conventions utilized across the project's codebase.

## 🏗️ Architecture Overview

The application is built on **Next.js (App Router)** and utilizes tightly coupled **Server Actions** to act as the intermediary bridging client-side components with the backend "database" (Google Sheets API).

### Key Directories:
- `src/app/`: Organizes the main routing.
  - `/`: The primary analytics dashboard.
  - `/inventory`: The dense data tables and model filtering layout.
  - `/kol`: Key Opinion Leader aggregation portal.
- `src/components/`: Houses client-heavy elements.
  - Base UI forms (`RequestFormModal.tsx`, `ReturnFormModal.tsx`).
  - Major Client Views (`DashboardClient.tsx`, `InventoryClient.tsx`, `KOLClient.tsx`).
  - Global layout abstractions (`DashboardLayout.tsx`).
- `server/`: Dedicated server-only operations.
  - `actions.ts`: Exportable strictly-server functions called by the client (uses `zod` for payload mapping).
  - `google.ts`: Internal abstraction specifically for GoogleAuth configuration and REST connection instances.
- `src/middleware.ts`: The Next.js Edge interceptor shielding route access based on validated JWT cookies.

---

## 🗄️ Google Sheets Integration

The primary hurdle of this application is maintaining state conformity with Google Sheets without exhausting rate limits.

1. **Schema Mapping**:
   Google Sheets returns an array of arrays. Inside `server/actions.ts`, the `getInventory()` action slices the raw target ranges (A2:O) and maps rows onto the `InventoryItem` TypeScript interface.
2. **Dynamic Aggregation ("FullData")**:
   Due to the Google Sheet having up to 15 fluctuating columns, rather than writing static property names, the server constructs a `fullData` Record dictionary. Keys are extracted from the header row natively so that column additions in Google Sheets dynamically appear in the client's `QuickViewPanel`.
3. **Caching**:
   To prevent intense 429 API Rate Limit errors on `getInventory()`, Next.js `unstable_cache` wraps this function with a standard TTL of strictly ~60-120 seconds.
4. **Revalidation**: 
   When a user clicks "Sync", or successfully submits the Outbound/Inbound `RequestFormModal`s, the server intrinsically calls `revalidateTag` to bust the sheet cache and supply fresh data.

---

## 🎨 Theming System (Tailwind & Next-Themes)

Hubz FOC utilizes `next-themes` mapped with Tailwind CSS's class strategy.
* Every UI component is expected to define *both* a Light Mode and Dark Mode utility class. 
* Do **NOT** use rigid dark tailwind classes exclusively. 
* **Convention Example**: Use `bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors` so the UI can swap cleanly seamlessly when `<ThemeToggle />` is hit.

---

## 🔒 Authentication & Edge Runtime

1. Basic security utilizes a hardcoded simple PIN check mapped in `server/actions.ts` -> `verifyPin()`.
2. A successful check generates a lightweight JWT using the `jose` library securely signed using the `GOOGLE_PRIVATE_KEY`.
3. The cookie `foc_auth_token` is flagged `httpOnly`. 
4. `src/middleware.ts` intercepts all deep links. Only Vercel-Edge compatible crypto algorithms can run in middleware, ergo `jose` is used instead of strictly Node-native packages (`jsonwebtoken`).

---

## 🐛 Troubleshooting Common Issues

* **New Sheet Columns breaking the App**:
  If the logistical team dramatically shifts the Header names (Row 1) of the Google Sheet, specific properties like `focStatus` or `imei` in `server/actions.ts` may fail their Array index lookups. Ensure `STATUS LOCATION` and `RETURN / UNRETURN` headers remain locked.
* **429 Quota Errors**:
  If this occurs, check `revalidateInventory` usage. Do not trigger rapid sequential state checks. Wait for cache decay.
* **Missing KOLs**:
  The `KOLClient` relies entirely on the `ON HOLDER` status field strings. Ensure team members input exact spelling strings because standard JS string matching controls grouping aggregations.
