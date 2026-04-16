/**
 * Server Actions — Barrel Export
 *
 * Re-exports all server actions from their focused modules.
 * Existing imports of `@/server/actions` continue to work unchanged.
 */

// Data fetching
export { getInventory, revalidateInventory, getOverdueData, getReturnHistory, getRequestHistory, getDashboardData } from "./inventory";

// Form mutations
export { requestUnits, returnUnit, returnUnits, transferUnit } from "./mutations";

// Authentication
export { verifyPin } from "./auth";

// Types (re-export for convenience)
export type { InventoryItem, OverdueItem, ReturnHistoryItem, RequestHistoryItem } from "@/types/inventory";
