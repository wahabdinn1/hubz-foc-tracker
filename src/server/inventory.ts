"use server";

import { sheets } from "./google";
import { unstable_cache, revalidatePath } from "next/cache";
import type { InventoryItem, OverdueItem, ReturnHistoryItem, RequestHistoryItem, Step1Data, Step3RefData } from "@/types/inventory";
import {
  SHEET_RANGES,
  STEP1_COLS,
  STEP3_COLS,
  STEP4_COLS,
  CACHE_TAG_INVENTORY,
  CACHE_REVALIDATE_SECONDS,
  QUICKVIEW_HIDDEN_KEYS,
} from "@/lib/constants";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// ---------------------------------------------------------------------------
// Positional Cell Reader
// ---------------------------------------------------------------------------

function cell(row: string[], idx: number): string {
  return row[idx]?.trim() || "";
}

// ---------------------------------------------------------------------------
// Step 1 Row Parser
// ---------------------------------------------------------------------------

function parseStep1Row(row: string[]): Step1Data {
  return {
    dateOfReceipt:     cell(row, STEP1_COLS.DATE_OF_RECEIPT),
    seinPicName:       cell(row, STEP1_COLS.SEIN_PIC_NAME),
    focType:           cell(row, STEP1_COLS.FOC_TYPE),
    imei:              cell(row, STEP1_COLS.IMEI),
    unitName:          cell(row, STEP1_COLS.UNIT_NAME),
    focStatus:         cell(row, STEP1_COLS.FOC_STATUS),
    plannedReturnDate: cell(row, STEP1_COLS.PLANNED_RETURN),
    receivedDateTimeStamp: cell(row, STEP1_COLS.RECEIVED_DATE_STAMP),
    goatPic:           cell(row, STEP1_COLS.GOAT_PIC),
    campaignName:      cell(row, STEP1_COLS.CAMPAIGN_NAME),
    status:            cell(row, STEP1_COLS.STATUS),
    statusLocation:    cell(row, STEP1_COLS.STATUS_LOCATION),
    onHolder:          cell(row, STEP1_COLS.ON_HOLDER),
    returnToTccReceipt: cell(row, STEP1_COLS.RETURN_TO_TCC),
    comments:          cell(row, STEP1_COLS.COMMENTS),
  };
}

// ---------------------------------------------------------------------------
// Step 3 Row Parser
// ---------------------------------------------------------------------------

function parseStep3Row(row: string[]): Step3RefData {
  return {
    timestamp:       cell(row, STEP3_COLS.TIMESTAMP),
    email:           cell(row, STEP3_COLS.EMAIL),
    requestor:       cell(row, STEP3_COLS.REQUESTOR),
    campaignName:    cell(row, STEP3_COLS.CAMPAIGN_NAME),
    unitName:        cell(row, STEP3_COLS.UNIT_NAME),
    imei:            cell(row, STEP3_COLS.IMEI),
    kolName:         cell(row, STEP3_COLS.KOL_NAME),
    kolPhone:        cell(row, STEP3_COLS.KOL_PHONE),
    kolAddress:      cell(row, STEP3_COLS.KOL_ADDRESS),
    deliveryDate:    cell(row, STEP3_COLS.DELIVERY_DATE),
    typeOfDelivery:  cell(row, STEP3_COLS.TYPE_OF_DELIVERY),
    typeOfFoc:       cell(row, STEP3_COLS.TYPE_OF_FOC),
  };
}

// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------

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

      const step3Map = buildStep3LookupMap(reqRows);

      return rows.slice(1).map((rawRow) => {
        const row = rawRow as string[];
        const s1 = parseStep1Row(row);

        let step3: Step3RefData | null = null;
        if (s1.imei && s1.imei !== "-") {
          step3 = step3Map.get(s1.imei) || null;
        }
        if (!step3 && s1.unitName && s1.onHolder) {
          step3 = step3Map.get(`${s1.unitName}||${s1.onHolder}`) || null;
        }

        const fullData = buildFullDataCompat(s1, step3);

        return {
          imei: s1.imei,
          unitName: s1.unitName,
          focStatus: s1.focStatus,
          goatPic: s1.goatPic,
          seinPic: s1.seinPicName,
          statusLocation: s1.statusLocation,
          onHolder: s1.onHolder,
          plannedReturnDate: s1.plannedReturnDate,
          campaignName: s1.campaignName,
          step1Data: s1,
          step3Data: step3,
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

function buildStep3LookupMap(
  reqRows: string[][] | null | undefined
): Map<string, Step3RefData> {
  const map = new Map<string, Step3RefData>();
  if (!reqRows || reqRows.length <= 1) return map;

  for (let i = 1; i < reqRows.length; i++) {
    const row = reqRows[i];
    if (!row || row.length === 0 || !row[STEP3_COLS.TIMESTAMP]) continue;

    const s3 = parseStep3Row(row);

    if (s3.imei && s3.imei.trim() !== "" && s3.imei.trim() !== "-") {
      map.set(s3.imei.trim(), s3);
    } else if (s3.unitName && s3.kolName) {
      map.set(`${s3.unitName.trim()}||${s3.kolName.trim()}`, s3);
    }
  }

  return map;
}

function buildFullDataCompat(s1: Step1Data, step3: Step3RefData | null): Record<string, string> {
  const fd: Record<string, string> = {};

  const step1Headers = [
    "Row", "DATE OF RECEIPT", "SEIN PIC NAME", "FOC TYPE",
    "SERIAL NUMBER (IMEI/SN)", "UNIT NAME", "FOC STATUS",
    "PLANNED RETURN DATE", "RECEIVED DATE TIME STAMP (LINK)",
    "GOAT PIC (PLANNER)", "CAMPAIGN NAME", "STATUS",
    "STATUS LOCATION", "ON HOLDER", "RETURN TO TCC RECEIPT (LINK)", "COMMENTS",
  ];
  const step1Values = [
    "", s1.dateOfReceipt, s1.seinPicName, s1.focType,
    s1.imei, s1.unitName, s1.focStatus,
    s1.plannedReturnDate, s1.receivedDateTimeStamp,
    s1.goatPic, s1.campaignName, s1.status,
    s1.statusLocation, s1.onHolder, s1.returnToTccReceipt, s1.comments,
  ];

  step1Headers.forEach((h, idx) => {
    if (h && !QUICKVIEW_HIDDEN_KEYS.has(h.toLowerCase())) {
      fd[h] = step1Values[idx] || "-";
    }
  });

  if (step3) {
    fd["Step 3 Request Date"] = step3.timestamp;
    fd["Step 3 Email"] = step3.email;
    fd["Step 3 Requestor"] = step3.requestor;
    fd["Step 3 Phone"] = step3.kolPhone;
    fd["Step 3 Address"] = step3.kolAddress;
    fd["Step 3 Type of FOC"] = step3.typeOfFoc;
  } else {
    fd["Step 3 Request Date"] = "-";
  }

  return fd;
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
// Combined Dashboard Fetch (#7)
// ---------------------------------------------------------------------------

export async function getDashboardData() {
  const [inventory, overdueItems, returnHistory] = await Promise.all([
    getInventory(),
    getOverdueData(),
    getReturnHistory(),
  ]);
  return { inventory, overdueItems, returnHistory };
}

// ---------------------------------------------------------------------------
// Overdue Tracker
// ---------------------------------------------------------------------------

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
        .map((rawRow) => {
          const row = rawRow as string[];
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
// Return History (Step 4) — Positional Parsing
// ---------------------------------------------------------------------------

export const getReturnHistory = unstable_cache(
  async (): Promise<ReturnHistoryItem[]> => {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: SHEET_RANGES.FOC_RETURN,
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) return [];

      return rows.slice(1)
        .filter(row => row && row.length > 0 && row[STEP4_COLS.TIMESTAMP])
        .map((rawRow) => {
          const row = rawRow as string[];
          return {
            timestamp:  cell(row, STEP4_COLS.TIMESTAMP),
            email:      cell(row, STEP4_COLS.EMAIL),
            requestor:  cell(row, STEP4_COLS.REQUESTOR),
            unitName:   cell(row, STEP4_COLS.UNIT_NAME),
            imei:       cell(row, STEP4_COLS.IMEI),
            fromKol:    cell(row, STEP4_COLS.FROM_KOL),
            kolAddress:  cell(row, STEP4_COLS.KOL_ADDRESS),
            kolPhone:   cell(row, STEP4_COLS.KOL_PHONE),
            typeOfFoc:  cell(row, STEP4_COLS.TYPE_OF_FOC),
            returnDate: cell(row, STEP4_COLS.REMARKS),
          };
        })
        .reverse();
    } catch (error) {
      console.error("Failed to fetch return history", error);
      return [];
    }
  },
  ["return-history"],
  { revalidate: CACHE_REVALIDATE_SECONDS }
);

// ---------------------------------------------------------------------------
// Request History (Step 3) — Positional Parsing
// ---------------------------------------------------------------------------

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
        .filter(row => row && row.length > 0 && row[STEP3_COLS.TIMESTAMP])
        .map((rawRow) => {
          const row = rawRow as string[];
          return {
            timestamp:      cell(row, STEP3_COLS.TIMESTAMP),
            email:          cell(row, STEP3_COLS.EMAIL),
            requestor:      cell(row, STEP3_COLS.REQUESTOR),
            campaignName:   cell(row, STEP3_COLS.CAMPAIGN_NAME),
            unitName:       cell(row, STEP3_COLS.UNIT_NAME),
            imei:           cell(row, STEP3_COLS.IMEI),
            kolName:        cell(row, STEP3_COLS.KOL_NAME),
            kolPhone:       cell(row, STEP3_COLS.KOL_PHONE),
            kolAddress:     cell(row, STEP3_COLS.KOL_ADDRESS),
            deliveryDate:   cell(row, STEP3_COLS.DELIVERY_DATE),
            typeOfDelivery: cell(row, STEP3_COLS.TYPE_OF_DELIVERY),
            typeOfFoc:      cell(row, STEP3_COLS.TYPE_OF_FOC),
          };
        })
        .reverse();
    } catch (error) {
      console.error("Failed to fetch request history", error);
      return [];
    }
  },
  ["request-history"],
  { revalidate: CACHE_REVALIDATE_SECONDS }
);
