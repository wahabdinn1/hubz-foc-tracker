/**
 * Application-wide constants.
 *
 * Centralizes magic strings, sheet identifiers, and configuration values
 * so they can be changed in one place without hunting through the codebase.
 */

// ---------------------------------------------------------------------------
// Google Sheets
// ---------------------------------------------------------------------------

/** Sheet names inside the Google Spreadsheet workbook. */
export const SHEETS = {
  DATA_BANK: "Step 1 Data Bank",
  FOC_REQUEST: "Step 3 FOC Request",
  FOC_RETURN: "Step 4 FOC Return",
} as const;

/** Column range used when fetching each sheet. */
export const SHEET_RANGES = {
  DATA_BANK: `${SHEETS.DATA_BANK}!A:P`,
  FOC_REQUEST: `${SHEETS.FOC_REQUEST}!A:H`,
} as const;

/**
 * Header-name lookup chains for the "Step 1 Data Bank" sheet.
 * Each key maps to an ordered list of possible header names,
 * allowing the app to survive minor header renames.
 */
export const COLUMN_HEADERS = {
  IMEI: ["SERIAL NUMBER (IMEI/SN)", "IMEI"],
  UNIT_NAME: ["UNIT NAME", "Unit Name"],
  FOC_STATUS: ["FOC STATUS", "RETURN / UNRETURN"],
  GOAT_PIC: ["GOAT PIC\n(PLANNER)", "PIC GOAT"],
  SEIN_PIC: ["SEIN PIC NAME", "PIC SEIN"],
  STATUS_LOCATION: ["STATUS LOCATION"],
  ON_HOLDER: ["ON HOLDER"],
  PLANNED_RETURN: ["PLANNED \nRETURN DATE", "Planned Return Date"],
  CAMPAIGN: ["CAMPAIGN NAME", "Campaign Name"],
} as const;

/**
 * Header-name lookup chains for the "Step 3 FOC Request" sheet.
 */
export const REQUEST_HEADERS = {
  TIMESTAMP: "Timestamp",
  UNIT_NAME: "Unit Name",
  IMEI: "IMEI",
  KOL_NAME: "KOL Name",
} as const;

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/** Name of the HTTP-only cookie that stores the JWT auth token. */
export const AUTH_COOKIE_NAME = "foc_auth_token";

/** JWT expiration time. */
export const JWT_EXPIRATION = "24h";

/** Cookie max-age in seconds (24 hours). */
export const COOKIE_MAX_AGE = 60 * 60 * 24;

// ---------------------------------------------------------------------------
// Status Location Values
// ---------------------------------------------------------------------------

/** Canonical status location strings used throughout the UI for filtering. */
export const STATUS = {
  AVAILABLE: "AVAILABLE",
  LOANED: "LOANED / ON KOL",
  RETURN_TO_TCC: "RETURN TO TCC",
} as const;

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

/** Cache tag for inventory data. */
export const CACHE_TAG_INVENTORY = "inventory-data";

/** Cache revalidation interval in seconds. */
export const CACHE_REVALIDATE_SECONDS = 30;

// ---------------------------------------------------------------------------
// QuickView Panel
// ---------------------------------------------------------------------------

/**
 * Keys to suppress from the QuickView "Complete Data Record" section.
 * These are ghost columns, link-only columns, or fields already
 * displayed in dedicated UI sections.
 */
export const QUICKVIEW_HIDDEN_KEYS = new Set([
  "c",
  "",
  "unknown column",
  "received date time stamp (link)",
  "return to tcc receipt (link)",
  "comments",
  "step 3 request date",
]);

// ---------------------------------------------------------------------------
// Email Domain
// ---------------------------------------------------------------------------

/** Email domain appended to usernames for form submissions. */
export const EMAIL_DOMAIN = "@wppmedia.com";
