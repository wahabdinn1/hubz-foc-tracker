"use server";

import { sheets } from "./google";
import { unstable_cache, revalidatePath } from "next/cache";
import type { InventoryItem, OverdueItem, ReturnHistoryItem } from "@/types/inventory";
import {
  SHEETS,
  SHEET_RANGES,
  COLUMN_HEADERS,
  REQUEST_HEADERS,
  CACHE_TAG_INVENTORY,
  CACHE_REVALIDATE_SECONDS,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

/**
 * Build a column-index lookup function from a row of header strings.
 * Returns -1 when the header is not found.
 */
function buildColIndex(headers: string[]) {
  return (name: string): number =>
    headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());
}

/**
 * Resolve a column value by trying multiple header names in priority order,
 * falling back to a positional index.
 */
function resolveColumn(
  row: string[],
  colIndex: (name: string) => number,
  headerNames: readonly string[],
  fallbackIdx?: number
): string {
  for (const name of headerNames) {
    const idx = colIndex(name);
    if (idx >= 0 && row[idx]) return row[idx];
  }
  return fallbackIdx !== undefined ? row[fallbackIdx] || "" : "";
}

// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------

/**
 * Fetch and transform inventory data from Google Sheets.
 *
 * Reads "Step 1 Data Bank" for device records and cross-references
 * "Step 3 FOC Request" to resolve formal request timestamps.
 * Results are cached with a 30-second TTL and invalidated on mutations.
 */
export const getInventory = unstable_cache(
  async (): Promise<InventoryItem[]> => {
    try {
      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: SHEET_ID,
        ranges: [SHEET_RANGES.DATA_BANK, SHEET_RANGES.FOC_REQUEST],
      });

      const rows = response.data.valueRanges?.[0].values;
      const reqRows = response.data.valueRanges?.[1].values;

      if (!rows || rows.length <= 1) {
        throw new Error("No inventory data found or only headers present.");
      }

      const headers = (rows[0] as string[]).map(
        (h) => h?.trim() || "Unknown Column"
      );
      const colIndex = buildColIndex(headers);

      // -- Build request-data lookup from Step 3 --
      const requestDataMap = buildRequestDataMap(reqRows);

      // -- Map each data row to an InventoryItem --
      return rows.slice(1).map((row) => {
        const fullData: Record<string, string> = {};
        headers.forEach((header, index) => {
          if (header) fullData[header] = row[index] || "-";
        });

        const col = (name: string) => {
          const idx = colIndex(name);
          return idx >= 0 ? row[idx] || "" : "";
        };

        const imei = resolveColumn(row, colIndex, COLUMN_HEADERS.IMEI, 5);
        const unitName = resolveColumn(row, colIndex, COLUMN_HEADERS.UNIT_NAME, 6);
        const kol = resolveColumn(row, colIndex, COLUMN_HEADERS.ON_HOLDER, 14);

        // Resolve request data: IMEI match → composite key match
        let reqData: Record<string, string> | undefined;
        if (imei && imei.trim() !== "" && imei.trim() !== "-") {
          reqData = requestDataMap.get(imei.trim());
        }
        if (!reqData && unitName && kol) {
          reqData = requestDataMap.get(`${unitName.trim()}||${kol.trim()}`);
        }

        let reqDate = reqData?.[REQUEST_HEADERS.TIMESTAMP] || "";
        if (!reqDate) {
          reqDate =
            fullData["Timestamp"] ||
            fullData["Date Received"] ||
            fullData["Request Date"] ||
            "-";
        }

        fullData["Step 3 Request Date"] = reqDate;
        
        // Expose Step 3 data directly in fullData so it can be autofilled in forms
        if (reqData) {
          if (reqData[REQUEST_HEADERS.REQUESTOR]) fullData["Step 3 Requestor"] = reqData[REQUEST_HEADERS.REQUESTOR];
          if (reqData[REQUEST_HEADERS.PHONE]) fullData["Step 3 Phone"] = reqData[REQUEST_HEADERS.PHONE];
          if (reqData[REQUEST_HEADERS.ADDRESS]) fullData["Step 3 Address"] = reqData[REQUEST_HEADERS.ADDRESS];
          if (reqData[REQUEST_HEADERS.TYPE_FOC]) fullData["Step 3 Type of FOC"] = reqData[REQUEST_HEADERS.TYPE_FOC];
        }

        return {
          imei,
          unitName,
          focStatus: resolveColumn(row, colIndex, COLUMN_HEADERS.FOC_STATUS, 7),
          goatPic: resolveColumn(row, colIndex, COLUMN_HEADERS.GOAT_PIC, 10),
          seinPic: resolveColumn(row, colIndex, COLUMN_HEADERS.SEIN_PIC, 3),
          statusLocation: resolveColumn(row, colIndex, COLUMN_HEADERS.STATUS_LOCATION, 13),
          onHolder: kol,
          plannedReturnDate: resolveColumn(row, colIndex, COLUMN_HEADERS.PLANNED_RETURN, 8),
          campaignName: resolveColumn(row, colIndex, COLUMN_HEADERS.CAMPAIGN, 11),
          fullData,
        };
      });
    } catch (error) {
      console.error("Failed to fetch inventory", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch inventory from Google Sheets"
      );
    }
  },
  [CACHE_TAG_INVENTORY],
  { revalidate: CACHE_REVALIDATE_SECONDS }
);

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Build a Map of request data from the Step 3 FOC Request
 * sheet. Keys are either raw IMEI values or composite "UnitName||KOLName".
 */
function buildRequestDataMap(
  reqRows: string[][] | null | undefined
): Map<string, Record<string, string>> {
  const requestData = new Map<string, Record<string, string>>();
  if (!reqRows || reqRows.length <= 1) return requestData;

  const reqHeaders = (reqRows[0] as string[]).map(
    (h) => h?.trim() || "Unknown"
  );
  const reqColIndex = buildColIndex(reqHeaders);

  const timeIdx = reqColIndex(REQUEST_HEADERS.TIMESTAMP);
  const unitIdx = reqColIndex(REQUEST_HEADERS.UNIT_NAME);
  const imeiIdx = reqColIndex(REQUEST_HEADERS.IMEI);
  const kolIdx = reqColIndex(REQUEST_HEADERS.KOL_NAME);
  
  const reqIdx = reqColIndex(REQUEST_HEADERS.REQUESTOR);
  const phoneIdx = reqColIndex(REQUEST_HEADERS.PHONE);
  const addrIdx = reqColIndex(REQUEST_HEADERS.ADDRESS);
  const typeFocIdx = reqColIndex(REQUEST_HEADERS.TYPE_FOC);

  for (let i = 1; i < reqRows.length; i++) {
    const r = reqRows[i];
    const timestamp = timeIdx >= 0 ? r[timeIdx] : undefined;
    const unitName = unitIdx >= 0 ? r[unitIdx] : undefined;
    const imei = imeiIdx >= 0 ? r[imeiIdx] : undefined;
    const kol = kolIdx >= 0 ? r[kolIdx] : undefined;
    
    if (timestamp) {
      const dataObj: Record<string, string> = {
        [REQUEST_HEADERS.TIMESTAMP]: timestamp,
        [REQUEST_HEADERS.REQUESTOR]: reqIdx >= 0 ? r[reqIdx] || "" : "",
        [REQUEST_HEADERS.PHONE]: phoneIdx >= 0 ? r[phoneIdx] || "" : "",
        [REQUEST_HEADERS.ADDRESS]: addrIdx >= 0 ? r[addrIdx] || "" : "",
        [REQUEST_HEADERS.TYPE_FOC]: typeFocIdx >= 0 ? r[typeFocIdx] || "" : "",
      };

      if (imei && imei.trim() !== "" && imei.trim() !== "-") {
        requestData.set(imei.trim(), dataObj);
      } else if (unitName && kol) {
        requestData.set(`${unitName.trim()}||${kol.trim()}`, dataObj);
      }
    }
  }

  return requestData;
}

/**
 * Force-revalidate the inventory cache.
 * Called after mutations or manually from the UI sync button.
 */
export async function revalidateInventory() {
  revalidatePath("/", "layout");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Overdue Tracker
// ---------------------------------------------------------------------------

/**
 * Fetch overdue device data from the "OVERDUE TRACKER" sheet.
 * Returns items that have overdue days > 0.
 */
export const getOverdueData = unstable_cache(
  async (): Promise<OverdueItem[]> => {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: SHEET_RANGES.OVERDUE_TRACKER,
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) return [];

      const headers = (rows[0] as string[]).map(h => h?.trim().toLowerCase() || "");

      return rows.slice(1)
        .map((row) => {
          const col = (name: string) => {
            const idx = headers.findIndex(h => h.includes(name.toLowerCase()));
            return idx >= 0 ? row[idx] || "" : "";
          };

          const overdueDaysRaw = col("overdue");
          const overdueDays = parseInt(overdueDaysRaw, 10);

          return {
            serialNumber: col("serial number"),
            materialDescription: col("material description"),
            planReturnDate: col("plan return date"),
            overdueDays: isNaN(overdueDays) ? 0 : overdueDays,
            statusUpdate: col("status update"),
            location: col("location"),
            seinPic: col("sein pic 1"),
            contactPerson: col("contact person"),
            nextStep: col("next step"),
          };
        })
        .filter(item => item.serialNumber && item.serialNumber.trim() !== "" && item.overdueDays > 0)
        .sort((a, b) => b.overdueDays - a.overdueDays);
    } catch (error) {
      console.error("Failed to fetch overdue data", error);
      return [];
    }
  },
  ["overdue-data"],
  { revalidate: CACHE_REVALIDATE_SECONDS }
);

// ---------------------------------------------------------------------------
// Return History (Step 4)
// ---------------------------------------------------------------------------

/**
 * Fetch return submission history from the "Step 4 FOC Return" sheet.
 */
export const getReturnHistory = unstable_cache(
  async (): Promise<ReturnHistoryItem[]> => {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: SHEET_RANGES.FOC_RETURN,
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) return [];

      // Step 4 headers: Timestamp | Email Address | Requestor | Unit Name | IMEI/SN | From KOL | KOL address | KOL Phone Number | Type of FOC | Delivery Date
      return rows.slice(1)
        .filter(row => row && row.length > 0 && row[0]) // skip empty rows
        .map((row) => ({
          timestamp: row[0] || "",
          email: row[1] || "",
          requestor: row[2] || "",
          unitName: row[3] || "",
          imei: row[4] || "",
          fromKol: row[5] || "",
          kolAddress: row[6] || "",
          kolPhone: row[7] || "",
          typeOfFoc: row[8] || "",
          returnDate: row[9] || "",
        }))
        .reverse(); // most recent first
    } catch (error) {
      console.error("Failed to fetch return history", error);
      return [];
    }
  },
  ["return-history"],
  { revalidate: CACHE_REVALIDATE_SECONDS }
);
import { RequestHistoryItem } from "@/types/inventory";

/**
 * Fetch request submission history from the "Step 3 FOC Request" sheet.
 */
export const getRequestHistory = unstable_cache(
  async (): Promise<RequestHistoryItem[]> => {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: SHEET_RANGES.FOC_REQUEST,
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) return [];

      return rows.slice(1)
        .filter(row => row && row.length > 0 && row[0]) // skip empty rows
        .map((row) => ({
          timestamp: row[0] || "",
          email: row[1] || "",
          requestor: row[2] || "",
          campaignName: row[3] || "",
          unitName: row[4] || "",
          imei: row[5] || "",
          kolName: row[6] || "",
          kolPhone: row[7] || "",
          kolAddress: row[8] || "",
          deliveryDate: row[9] || "",
          typeOfDelivery: row[10] || "",
          typeOfFoc: row[11] || "",
        }))
        .reverse(); // most recent first
    } catch (error) {
      console.error("Failed to fetch request history", error);
      return [];
    }
  },
  ["request-history"],
  { revalidate: CACHE_REVALIDATE_SECONDS }
);
