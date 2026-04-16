"use server";

import { sheets } from "./google";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAuthenticated } from "@/lib/auth";
import {
  requestPayloadSchema,
  returnSchema,
  transferPayloadSchema,
  type RequestPayload,
  type ReturnPayload,
  type TransferPayload,
} from "@/lib/validations";
import { SHEETS, SHEET_RANGES, EMAIL_DOMAIN, STEP1_COLS, STEP3_COLS } from "@/lib/constants";
import { sendFocNotification, sendFocBatchNotification } from "@/lib/mailer";
import { resolveRequestorWithFallback } from "@/lib/form-utils";
import type { ActionResult } from "@/types/inventory";

type MutationResult = ActionResult;

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// ---------------------------------------------------------------------------
// Shared Mutation Helpers
// ---------------------------------------------------------------------------

/** Format a GMT+7 timestamp for Google Sheets rows. */
function formatTimestampGMT7(): string {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const month = get("month");
  const day = get("day");
  const year = get("year");
  const rawHour = get("hour");
  const hour = rawHour === "24" ? "00" : rawHour.padStart(2, "0");
  const minute = get("minute").padStart(2, "0");
  const second = get("second").padStart(2, "0");

  return `${month}/${day}/${year} ${hour}:${minute}:${second}`;
}

/** Prefix formula-injection characters to prevent Code Injection via spreadsheet cells. */
function sanitizeCell(value: string): string {
  if (!value) return value;
  const first = value[0];
  if (first === "=" || first === "+" || first === "-" || first === "@") {
    return `'${value}`;
  }
  return value;
}

function sanitizeRow(row: string[]): string[] {
  return row.map(sanitizeCell);
}

/** Build a full email address from a username. */
function resolveEmailAddress(username: string): string {
  return `${username}${EMAIL_DOMAIN}`;
}

/** Resolve the effective requestor name with case-insensitive matching. */
function resolveRequestor(requestor: string, customRequestor?: string): string {
  const { requestor: resolved, customRequestor: custom } = resolveRequestorWithFallback(requestor === "Other" ? customRequestor || "Other" : requestor);
  return custom || resolved;
}

/** Resolve the effective campaign name, handling "Other" → custom fallback. */
function resolveCampaign(campaignName: string, customCampaign?: string): string {
  return campaignName === "Other" ? customCampaign || "Other" : campaignName;
}

async function findLastDataRow(sheetName: string): Promise<number> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:A`,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) return 1;

  let lastRow = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (row && row.length > 0 && row[0] !== undefined && String(row[0]).trim() !== "") {
      lastRow = i + 1;
      break;
    }
  }

  return lastRow;
}

async function appendRows(
  sheetName: string,
  values: string[][]
): Promise<void> {
  const lastRow = await findLastDataRow(sheetName);
  const nextRow = lastRow + 1;

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A${nextRow}`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: values.map(sanitizeRow),
    },
  });

  if (!response.data.updates) {
    throw new Error(`Failed to append ${values.length} row(s) to sheet "${sheetName}" — no updates returned.`);
  }
}

export async function requestUnits(data: RequestPayload): Promise<MutationResult> {
  if (!(await isAuthenticated())) {
    return { success: false, error: "Unauthorized — please log in first." };
  }

  try {
    const validated = requestPayloadSchema.parse(data);

    if (!validated.devices || validated.devices.length === 0) {
      return { success: false, error: "No devices provided for request." };
    }

    if (validated.devices.length > 50) {
      return { success: false, error: `Batch size too large (${validated.devices.length} items). Maximum 50 items per batch.` };
    }

    const imeisToCheck = validated.devices
      .map(d => (d.imeiIfAny || "").trim())
      .filter(imei => imei && imei !== "none");

    if (imeisToCheck.length > 0) {
      const [step1Response, step3Response] = await Promise.all([
        sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: SHEET_RANGES.DATA_BANK,
        }),
        sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: SHEET_RANGES.FOC_REQUEST,
        }),
      ]);

      const step1Rows = step1Response.data.values;
      if (step1Rows && step1Rows.length > 1) {
        for (const submittedImei of imeisToCheck) {
          const matchingRow = step1Rows
            .slice(1)
            .find(
              (row) =>
                (row[STEP1_COLS.IMEI] || "").trim().toUpperCase() ===
                submittedImei.toUpperCase()
            );

          if (matchingRow) {
            const currentStatus = (matchingRow[STEP1_COLS.STATUS_LOCATION] || "")
              .trim()
              .toUpperCase();
            if (!currentStatus.includes("AVAILABLE")) {
              return {
                success: false,
                error: `Unit ${submittedImei} has just been taken by another PIC. Please select a different unit.`,
              };
            }
          }
        }
      }

      const step3Rows = step3Response.data.values;
      if (step3Rows && step3Rows.length > 1) {
        const recentRows = step3Rows.slice(
          Math.max(1, step3Rows.length - 100)
        );
        for (const submittedImei of imeisToCheck) {
          const collision = recentRows.find(
            (row) => {
              const rowImei = (row[STEP3_COLS.IMEI] || "").trim().toUpperCase();
              if (rowImei !== submittedImei.toUpperCase()) return false;
              const deliverCol = row[STEP3_COLS.DELIVER];
              return deliverCol?.trim().toUpperCase() === "TRUE";
            }
          );

          if (collision) {
            return {
              success: false,
              error: `Request collision detected for ${submittedImei}. This unit was just processed. Please select a different unit.`,
            };
          }
        }
      }
    }

    const timestamp = formatTimestampGMT7();
    const emailAddress = resolveEmailAddress(validated.username);
    const finalRequestor = resolveRequestor(validated.requestor, validated.customRequestor);
    const finalCampaign = resolveCampaign(validated.campaignName, validated.customCampaign);

    const rowsToWrite = validated.devices.map(device => [
      timestamp,
      emailAddress,
      finalRequestor,
      finalCampaign,
      device.unitName,
      device.imeiIfAny || "",
      device.kolName,
      device.kolPhoneNumber,
      device.kolAddress,
      device.deliveryDate,
      device.typeOfDelivery,
      device.typeOfFoc,
      "TRUE",
    ]);

    try {
      await appendRows(SHEETS.FOC_REQUEST, rowsToWrite);
    } catch (writeError) {
      console.error("Failed to write batch request rows", writeError);
      return {
        success: false,
        error: `Failed to write ${rowsToWrite.length} request rows to Google Sheets. No rows were saved. Please try again.`,
      };
    }

    try {
      const batchItems = validated.devices.map(device => ({
        actionType: "REQUEST" as const,
        unitName: device.unitName,
        imei: device.imeiIfAny || "-",
        kolName: device.kolName,
        requestor: finalRequestor,
        email: emailAddress,
        timestamp,
        additionalData: {
          Campaign: finalCampaign,
          "Delivery Date": device.deliveryDate,
          "Type of Delivery": device.typeOfDelivery,
          "Type of FOC": device.typeOfFoc,
        },
      }));
      await sendFocBatchNotification(batchItems);
    } catch (mailError) {
      console.error("[MAILER] Failed to send request notification:", mailError);
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to append request", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error: "Failed to request unit due to a server error.",
    };
  }
}

export async function returnUnit(data: ReturnPayload): Promise<MutationResult> {
  if (!(await isAuthenticated())) {
    return { success: false, error: "Unauthorized — please log in first." };
  }

  try {
    const validated = returnSchema.parse(data);

    const timestamp = formatTimestampGMT7();
    const emailAddress = resolveEmailAddress(validated.username);
    const finalRequestor = resolveRequestor(validated.requestor, validated.customRequestor);

    await appendRows(SHEETS.FOC_RETURN, [
      [
        timestamp,
        emailAddress,
        finalRequestor,
        validated.unitName,
        validated.imei,
        validated.fromKol,
        validated.kolAddress,
        validated.kolPhoneNumber,
        validated.typeOfFoc,
        "",
      ],
    ]);

    try {
      await sendFocNotification({
        actionType: "RETURN",
        unitName: validated.unitName,
        imei: validated.imei,
        kolName: validated.fromKol,
        requestor: finalRequestor,
        email: emailAddress,
        timestamp,
        additionalData: {
          "Type of FOC": validated.typeOfFoc,
        },
      });
    } catch (mailError) {
      console.error("[MAILER] Failed to send return notification:", mailError);
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to append return", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error: "Failed to return unit due to a server error.",
    };
  }
}

export async function returnUnits(dataArray: ReturnPayload[]): Promise<MutationResult> {
  if (!(await isAuthenticated())) {
    return { success: false, error: "Unauthorized — please log in first." };
  }

  if (!dataArray || dataArray.length === 0) {
    return { success: false, error: "No units provided for return." };
  }

  if (dataArray.length > 50) {
    return { success: false, error: `Batch size too large (${dataArray.length} items). Maximum 50 items per batch.` };
  }

  try {
    const batchTimestamp = formatTimestampGMT7();
    const valuesToWrite: string[][] = [];
    
    for (const data of dataArray) {
      const validated = returnSchema.parse(data);
      const emailAddress = resolveEmailAddress(validated.username);
      const finalRequestor = resolveRequestor(validated.requestor, validated.customRequestor);

      valuesToWrite.push([
        batchTimestamp,
        emailAddress,
        finalRequestor,
        validated.unitName,
        validated.imei,
        validated.fromKol,
        validated.kolAddress,
        validated.kolPhoneNumber,
        validated.typeOfFoc,
        "",
      ]);
    }

    try {
      await appendRows(SHEETS.FOC_RETURN, valuesToWrite);
    } catch (writeError) {
      console.error("Failed to write batch return rows", writeError);
      return {
        success: false,
        error: `Failed to write ${valuesToWrite.length} return rows to Google Sheets. No rows were saved. Please try again.`,
      };
    }

    try {
      const batchItems = dataArray.map((data) => {
        const v = returnSchema.parse(data);
        const req = resolveRequestor(v.requestor, v.customRequestor);
        const eml = resolveEmailAddress(v.username);
        return {
          actionType: "RETURN" as const,
          unitName: v.unitName,
          imei: v.imei,
          kolName: v.fromKol,
          requestor: req,
          email: eml,
          timestamp: batchTimestamp,
          additionalData: {
            "Type of FOC": v.typeOfFoc,
          },
        };
      });
      await sendFocBatchNotification(batchItems);
    } catch (mailError) {
      console.error("[MAILER] Failed to send batch return notification:", mailError);
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to append multiple returns", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed for one or more items.",
      };
    }
    return {
      success: false,
      error: "Failed to batch return units due to a server error.",
    };
  }
}

export async function transferUnit(data: TransferPayload): Promise<MutationResult> {
  if (!(await isAuthenticated())) {
    return { success: false, error: "Unauthorized — please log in first." };
  }

  try {
    const validated = transferPayloadSchema.parse(data);
    const submittedImei = validated.imei.trim();

    const step1Response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGES.DATA_BANK,
    });

    const step1Rows = step1Response.data.values;
    if (!step1Rows || step1Rows.length <= 1) {
      return { success: false, error: "Could not read inventory data." };
    }

    const step1Headers = (step1Rows[0] as string[]).map((h) =>
      h?.trim().toUpperCase() || ""
    );

    const imeiColIdx = step1Headers.findIndex(
      (h) => h.includes("SERIAL NUMBER") || h.includes("IMEI")
    );
    const statusColIdx = step1Headers.findIndex(
      (h) => h.includes("STATUS LOCATION")
    );

    if (imeiColIdx < 0 || statusColIdx < 0) {
      return { success: false, error: "Could not locate required columns in Step 1." };
    }

    const matchingRow = step1Rows
      .slice(1)
      .find(
        (row) =>
          (row[imeiColIdx] || "").trim().toUpperCase() ===
          submittedImei.toUpperCase()
      );

    if (!matchingRow) {
      return { success: false, error: "IMEI not found in inventory." };
    }

    const currentStatus = (matchingRow[statusColIdx] || "").trim().toUpperCase();
    if (!currentStatus.includes("LOANED") && !currentStatus.includes("ON KOL")) {
      return {
        success: false,
        error: `This unit is no longer on loan (current status: ${matchingRow[statusColIdx]?.trim() || "Unknown"}). Transfer cannot proceed.`,
      };
    }

    const timestamp = formatTimestampGMT7();
    const emailAddress = resolveEmailAddress(validated.username);
    const finalRequestor = resolveRequestor(validated.requestor, validated.customRequestor);
    const finalCampaign = resolveCampaign(validated.campaignName, validated.customCampaign);

    const remarksText = `Direct Transfer to ${validated.kol2Name} - ${finalCampaign}`;

    const returnRow = [
      timestamp,
      emailAddress,
      finalRequestor,
      validated.unitName,
      validated.imei,
      validated.currentHolder,
      "-",
      "-",
      validated.typeOfFoc,
      remarksText,
    ];

    const requestRow = [
      timestamp,
      emailAddress,
      finalRequestor,
      finalCampaign,
      validated.unitName,
      validated.imei,
      validated.kol2Name,
      validated.kol2Phone,
      validated.kol2Address,
      validated.transferDate,
      "Direct Transfer",
      validated.typeOfFoc,
      "TRUE",
    ];

    try {
      await appendRows(SHEETS.FOC_RETURN, [returnRow]);
    } catch (stepAError) {
      console.error("Transfer Step A (Return from KOL 1) failed", stepAError);
      return {
        success: false,
        error: "Failed to record the return from the current holder. Transfer aborted.",
      };
    }

    try {
      await appendRows(SHEETS.FOC_REQUEST, [requestRow]);
    } catch (stepBError) {
      console.error("Transfer Step B (Issue to KOL 2) failed", stepBError);
      return {
        success: false,
        error: `PARTIAL: Return from KOL 1 was recorded, but issuing to KOL 2 failed. Manual reconciliation needed. Return timestamp: ${timestamp}. Please create a manual request for ${validated.kol2Name}.`,
      };
    }

    try {
      await sendFocNotification({
        actionType: "TRANSFER",
        unitName: validated.unitName,
        imei: validated.imei,
        kolName: `${validated.currentHolder} → ${validated.kol2Name}`,
        requestor: finalRequestor,
        email: emailAddress,
        timestamp,
        additionalData: {
          Campaign: finalCampaign,
          "Transfer Date": validated.transferDate,
          "Type of FOC": validated.typeOfFoc,
        },
      });
    } catch (mailError) {
      console.error("[MAILER] Failed to send transfer notification:", mailError);
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to process transfer", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error: "Failed to process transfer due to a server error.",
    };
  }
}
