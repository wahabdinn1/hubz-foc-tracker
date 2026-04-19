/**
 * Core inventory types for the Hubz FOC Tracker.
 *
 * These types model the data flowing from Google Sheets through
 * Server Actions into client components.
 */

// ---------------------------------------------------------------------------
// Step 1 Data Bank — Exact Column Structure
// ---------------------------------------------------------------------------

/**
 * Typed representation of a single row from the "Step 1 Data Bank" sheet.
 * Column indices match the exact layout validated against FOC.xlsx:
 *
 *   0: (row marker)
 *   1: DATE OF RECEIPT
 *   2: SEIN PIC NAME
 *   3: FOC TYPE
 *   4: SERIAL NUMBER (IMEI/SN)
 *   5: UNIT NAME
 *   6: FOC STATUS
 *   7: PLANNED RETURN DATE
 *   8: RECEIVED DATE TIME STAMP (LINK)
 *   9: GOAT PIC (PLANNER)
 *  10: CAMPAIGN NAME
 *  11: STATUS
 *  12: STATUS LOCATION
 *  13: ON HOLDER
 *  14: RETURN TO TCC RECEIPT (LINK)
 *  15: COMMENTS
 */
export interface Step1Data {
    dateOfReceipt: string;
    seinPicName: string;
    focType: string;
    imei: string;
    unitName: string;
    focStatus: string;
    plannedReturnDate: string;
    receivedDateTimeStamp: string;
    goatPic: string;
    campaignName: string;
    status: string;
    statusLocation: string;
    onHolder: string;
    returnToTccReceipt: string;
    comments: string;
}

// ---------------------------------------------------------------------------
// Step 3 Cross-Reference Data
// ---------------------------------------------------------------------------

/**
 * Cross-referenced data from the "Step 3 FOC Request" sheet,
 * matched by IMEI or composite key (UnitName||KOL).
 *
 * Column indices for Step 3:
 *   0: Timestamp
 *   1: Email Address
 *   2: Requestor
 *   3: Campaign Name
 *   4: Unit Name
 *   5: IMEI if any
 *   6: KOL Name
 *   7: KOL Phone Number
 *   8: KOL address
 *   9: Delivery Date
 *  10: Type Of Delivery
 *  11: Type of FOC
 *  12: Deliver
 */
export interface Step3RefData {
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
    /** Date when the device was first received into stock. */
    dateOfReceipt: string;
    /** Type of FOC — e.g. "Loan", "Gift". */
    focType: string;
    /** Link to return receipt for TCC returns. */
    returnToTccReceipt: string;
    /** Cross-referenced Step 3 request data (if matched). */
    step3Data: Step3RefData | null;
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

/** A row from the "Step 3 FOC Request" sheet. Structurally identical to Step3RefData. */
export type RequestHistoryItem = Step3RefData;

// ---------------------------------------------------------------------------
// Server Action Responses
// ---------------------------------------------------------------------------

/** Standard response shape returned by mutation server actions. */
export type ActionResult<T = void> =
    | { success: true; data?: T }
    | { success: false; error: string };
