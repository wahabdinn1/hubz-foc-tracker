/**
 * Server Actions — Barrel Export
 *
 * Re-exports all server actions from their focused modules.
 * Existing imports of `@/server/actions` continue to work unchanged.
 */

// Data fetching
export { getInventory, revalidateInventory } from "./inventory";

// Form mutations
export { requestUnit, returnUnit } from "./mutations";

// Authentication
export { verifyPin } from "./auth";

// Types (re-export for convenience)
export type { InventoryItem } from "@/types/inventory";
