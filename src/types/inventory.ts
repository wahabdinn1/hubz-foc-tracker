/**
 * Core inventory types for the Hubz FOC Tracker.
 *
 * These types model the data flowing from Google Sheets through
 * Server Actions into client components.
 */

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

/** A single inventory row from the "Step 1 Data Bank" sheet. */
export interface InventoryItem {
  /** IMEI / Serial Number identifier. */
  imei: string;
  /** Human-readable device model name. */
  unitName: string;
  /** FOC lifecycle status — e.g. "RETURN", "UNRETURN". */
  focStatus: string;
  /** GOAT planner PIC assigned to this device. */
  goatPic: string;
  /** SEIN PIC assigned to this device. */
  seinPic: string;
  /** Current physical location status — e.g. "AVAILABLE", "LOANED / ON KOL". */
  statusLocation: string;
  /** KOL name currently holding the device (empty when available). */
  onHolder: string;
  /** Target return date string — may be a date, "ASAP", or empty. */
  plannedReturnDate: string;
  /** Marketing campaign this device is assigned to. */
  campaignName: string;
  /** Raw key-value map of every column from the spreadsheet row. */
  fullData: Record<string, string>;
}

// ---------------------------------------------------------------------------
// KOL (Key Opinion Leader)
// ---------------------------------------------------------------------------

/** Aggregated profile data for a single KOL, derived from inventory rows. */
export interface KOLProfile {
  /** KOL display name (from the "ON HOLDER" column). */
  name: string;
  /** Phone number (from "KOL PHONE NUMBER" column, if available). */
  phone: string;
  /** Address (from "KOL ADDRESS" column, if available). */
  address: string;
  /** Number of devices currently on loan to this KOL. */
  activeCount: number;
  /** Total number of devices ever assigned to this KOL. */
  totalItems: number;
  /** All inventory items associated with this KOL. */
  items: InventoryItem[];
}

// ---------------------------------------------------------------------------
// Dashboard Aggregations
// ---------------------------------------------------------------------------

/** Extended inventory item used for grouped return tracking on the dashboard. */
export interface ReturnTrackingItem extends InventoryItem {
  /** Number of devices in this aggregated group. */
  groupCount: number;
}

// ---------------------------------------------------------------------------
// Server Action Responses
// ---------------------------------------------------------------------------

/** Standard response shape returned by mutation server actions. */
export interface ActionResult {
  success: boolean;
  error?: string;
}
