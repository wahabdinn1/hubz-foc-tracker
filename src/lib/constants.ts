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
  OVERDUE_TRACKER: "OVERDUE TRACKER",
} as const;

/** Column range used when fetching each sheet. */
export const SHEET_RANGES = {
  DATA_BANK: `${SHEETS.DATA_BANK}!A:P`,
  FOC_REQUEST: `${SHEETS.FOC_REQUEST}!A:M`,
  FOC_RETURN: `${SHEETS.FOC_RETURN}!A:J`,
  OVERDUE_TRACKER: `${SHEETS.OVERDUE_TRACKER}!A:U`,
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
  EMAIL: "Email Address",
  UNIT_NAME: "Unit Name",
  IMEI: "IMEI if any",
  KOL_NAME: "KOL Name",
  REQUESTOR: "Requestor",
  PHONE: "KOL Phone Number",
  ADDRESS: "KOL address",
  TYPE_FOC: "Type of FOC",
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

/** Cache revalidation interval in seconds. Set to 1 hour since mutations force revalidation */
export const CACHE_REVALIDATE_SECONDS = 60;

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

// ---------------------------------------------------------------------------
// Form Dropdown Options
// ---------------------------------------------------------------------------

/** Requestor names for the dropdown in both Request and Return forms. */
export const REQUESTORS = [
  "Abigail",
  "Aliya",
  "Khalida",
  "Oliv",
  "Sulu",
  "Tashya",
  "Venni",
  "Other",
] as const;

/** FOC type options (used in both forms). */
export const FOC_TYPES = [
  "ACCESSORIES",
  "APS",
  "BUDS",
  "HANDPHONE",
  "PACKAGES",
  "RUGGED",
  "TAB",
  "WEARABLES",
] as const;

/** Delivery type options (used in Request form). */
export const DELIVERY_TYPES = [
  "BLUEBIRD",
  "TIKI",
] as const;

/** Campaign options (used in Request and Transfer forms). */
export const CAMPAIGNS = [
  "Galaxy S25 FE Sustenance 2026",
  "Q7B7 Sustenance Batch 2",
  "A07 5G Launch",
  "A07 & A17 Sust Ramadan",
  "Buds 4 Launch",
  "Galaxy Tab A11+ Launch",
  "Ramadan 2026",
  "Living DA",
  "Kitchen DA",
  "AC DA",
  "Tab A11 Kids Pack",
  "Tiktok Branded Mission PAF4",
  "UGC PAF4",
  "Miracle Annual KOL 2026",
  "Miracle KOL and Community",
  "Miracle GCL BKK",
  "Miracle UNPK Riders",
  "Tab S11 Sustenance",
  "A57/A37 Launching",
  "A Series Tiara Andini (Annual)",
  "Internet Media A07 5G GOAT - Mar - 005",
  "Internet Media A07 A17 Ramadhan GOAT - Mar - 009",
  "Other",
] as const;

/** Device category prefixes for the 2-step unit selection. */
export const DEVICE_CATEGORIES = [
  { prefix: "G-S", label: "S Series", icon: "📱" },
  { prefix: "G-A", label: "A Series", icon: "📱" },
  { prefix: "G-T", label: "Tab", icon: "📋" },
  { prefix: "G-B", label: "Buds", icon: "🎧" },
  { prefix: "G-W", label: "Wearable", icon: "⌚" },
] as const;

export const FOC_TYPE_KEYS = ["FOC TYPE", "TYPE OF FOC", "Type of FOC", "Foc Type"] as const;
