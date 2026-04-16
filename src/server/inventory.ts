"use server";

import { sheets } from "./google";
import { unstable_cache, revalidatePath } from "next/cache";
import type { InventoryItem, OverdueItem, ReturnHistoryItem, RequestHistoryItem, Step1Data, Step3RefData } from "@/types/inventory";
import {
  SHEET_RANGES,
  STEP1_COLS,
  STEP3_COLS,
  STEP4_COLS,
  OVERDUE_COLS,
  CACHE_TAG_INVENTORY,
  CACHE_REVALIDATE_SECONDS,
  isStatusLoaned,
} from "@/lib/constants";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function cell(row: string[], idx: number): string {
  return row[idx]?.trim() || "";
}

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

      return rows.slice(1)
        .filter((rawRow) => {
          const row = rawRow as string[];
          const hasImei = (row[STEP1_COLS.IMEI] || "").trim() !== "";
          const hasUnit = (row[STEP1_COLS.UNIT_NAME] || "").trim() !== "";
          return hasImei || hasUnit;
        })
        .map((rawRow) => {
        const row = rawRow as string[];
        const s1 = parseStep1Row(row);

        let step3: Step3RefData | null = null;
        if (s1.imei && s1.imei !== "-") {
          step3 = step3Map.get(s1.imei) || null;
        }
        if (!step3 && s1.unitName && s1.onHolder) {
          step3 = step3Map.get(`${s1.unitName}||${s1.onHolder}`) || null;
        }

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

export async function revalidateInventory() {
  revalidatePath("/", "layout");
  return { success: true };
}

export async function getDashboardData() {
  const [inventory, overdueItems, returnHistory] = await Promise.all([
    getInventory(),
    getOverdueData(),
    getReturnHistory(),
  ]);
  return { inventory, overdueItems, returnHistory };
}

export const getOverdueData = unstable_cache(
  async (): Promise<OverdueItem[]> => {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: SHEET_RANGES.OVERDUE_TRACKER,
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) return [];

      return rows.slice(1)
        .map((rawRow) => {
          const row = rawRow as string[];
          const overdueDaysRaw = cell(row, OVERDUE_COLS.OVERDUE_DAYS);
          const overdueDays = parseInt(overdueDaysRaw, 10);

          return {
            serialNumber: cell(row, OVERDUE_COLS.SERIAL_NUMBER),
            materialDescription: cell(row, OVERDUE_COLS.MATERIAL_DESCRIPTION),
            planReturnDate: cell(row, OVERDUE_COLS.PLAN_RETURN_DATE),
            overdueDays: isNaN(overdueDays) ? 0 : overdueDays,
            statusUpdate: cell(row, OVERDUE_COLS.STATUS_UPDATE),
            location: cell(row, OVERDUE_COLS.LOCATION),
            seinPic: cell(row, OVERDUE_COLS.SEIN_PIC),
            contactPerson: cell(row, OVERDUE_COLS.CONTACT_PERSON),
            nextStep: cell(row, OVERDUE_COLS.NEXT_STEP),
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
