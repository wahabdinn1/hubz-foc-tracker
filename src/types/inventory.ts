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
// Overdue Tracker
// ---------------------------------------------------------------------------

/** A row from the "OVERDUE TRACKER" sheet. */
export interface OverdueItem {
  /** Serial number / IMEI. */
  serialNumber: string;
  /** Material description (device name). */
  materialDescription: string;
  /** Planned return date string. */
  planReturnDate: string;
  /** Number of days overdue (positive = overdue). */
  overdueDays: number;
  /** Current status update text. */
  statusUpdate: string;
  /** Location (GOAT, etc). */
  location: string;
  /** SEIN PIC names. */
  seinPic: string;
  /** Contact person. */
  contactPerson: string;
  /** Next step action. */
  nextStep: string;
}

// ---------------------------------------------------------------------------
// Return History (Step 4)
// ---------------------------------------------------------------------------

/** A row from the "Step 4 FOC Return" sheet. */
export interface ReturnHistoryItem {
  /** Timestamp of the return submission. */
  timestamp: string;
  /** Email of the submitter. */
  email: string;
  /** Requestor name. */
  requestor: string;
  /** Device unit name. */
  unitName: string;
  /** IMEI / Serial Number. */
  imei: string;
  /** KOL name the device was returned from. */
  fromKol: string;
  /** KOL address. */
  kolAddress: string;
  /** KOL phone number. */
  kolPhone: string;
  /** Type of FOC. */
  typeOfFoc: string;
  /** Return date (Column J) */
  returnDate: string;
}

// ---------------------------------------------------------------------------
// Request History (Step 3)
// ---------------------------------------------------------------------------

/** A row from the "Step 3 FOC Request" sheet. */
export interface RequestHistoryItem {
  timestamp: string;
  email: string;
  requestor: string;
  campaignName: string;
  unitName: string;
  imei: string;
  kolName: string;
  kolPhone: string;
  kolAddress: string;
  deliveryDate: string;
  typeOfDelivery: string;
  typeOfFoc: string;
}

// ---------------------------------------------------------------------------
// Server Action Responses
// ---------------------------------------------------------------------------

/** Standard response shape returned by mutation server actions. */
export interface ActionResult {
  success: boolean;
  error?: string;
}
