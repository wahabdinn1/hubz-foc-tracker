"use server";

import { sheets } from "./google";
import { unstable_cache, revalidatePath } from "next/cache";
import type { InventoryItem } from "@/types/inventory";
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

      // -- Build request-date lookup from Step 3 --
      const requestDates = buildRequestDateMap(reqRows);

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

        // Resolve request date: IMEI match → composite key match → fallback
        let reqDate = "";
        if (imei && imei.trim() !== "" && imei.trim() !== "-") {
          reqDate = requestDates.get(imei.trim()) || "";
        }
        if (!reqDate && unitName && kol) {
          reqDate = requestDates.get(`${unitName.trim()}||${kol.trim()}`) || "";
        }
        if (!reqDate) {
          reqDate =
            fullData["Timestamp"] ||
            fullData["Date Received"] ||
            fullData["Request Date"] ||
            "-";
        }

        fullData["Step 3 Request Date"] = reqDate;

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
 * Build a Map<string, string> of request dates from the Step 3 FOC Request
 * sheet. Keys are either raw IMEI values or composite "UnitName||KOLName".
 */
function buildRequestDateMap(
  reqRows: string[][] | null | undefined
): Map<string, string> {
  const requestDates = new Map<string, string>();
  if (!reqRows || reqRows.length <= 1) return requestDates;

  const reqHeaders = (reqRows[0] as string[]).map(
    (h) => h?.trim() || "Unknown"
  );
  const reqColIndex = buildColIndex(reqHeaders);

  const timeIdx = reqColIndex(REQUEST_HEADERS.TIMESTAMP);
  const unitIdx = reqColIndex(REQUEST_HEADERS.UNIT_NAME);
  const imeiIdx = reqColIndex(REQUEST_HEADERS.IMEI);
  const kolIdx = reqColIndex(REQUEST_HEADERS.KOL_NAME);

  for (let i = 1; i < reqRows.length; i++) {
    const r = reqRows[i];
    const timestamp = timeIdx >= 0 ? r[timeIdx] : undefined;
    const unitName = unitIdx >= 0 ? r[unitIdx] : undefined;
    const imei = imeiIdx >= 0 ? r[imeiIdx] : undefined;
    const kol = kolIdx >= 0 ? r[kolIdx] : undefined;

    if (timestamp) {
      if (imei && imei.trim() !== "" && imei.trim() !== "-") {
        requestDates.set(imei.trim(), timestamp);
      } else if (unitName && kol) {
        requestDates.set(`${unitName.trim()}||${kol.trim()}`, timestamp);
      }
    }
  }

  return requestDates;
}

/**
 * Force-revalidate the inventory cache.
 * Called after mutations or manually from the UI sync button.
 */
export async function revalidateInventory() {
  revalidatePath("/", "layout");
  return { success: true };
}
