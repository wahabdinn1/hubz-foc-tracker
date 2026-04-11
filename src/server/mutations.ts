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
import { SHEETS, SHEET_RANGES, EMAIL_DOMAIN } from "@/lib/constants";
import type { ActionResult } from "@/types/inventory";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// ---------------------------------------------------------------------------
// Timestamp — GMT+7 (Asia/Jakarta)
// ---------------------------------------------------------------------------

/**
 * Format the current moment as `M/D/YYYY HH:mm:ss` in GMT+7 (Asia/Jakarta).
 * Uses `Intl.DateTimeFormat` to guarantee the correct timezone regardless
 * of the server's system clock locale.
 *
 * Example output: `2/20/2026 16:29:07`
 */
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
  // Intl may return "24" for midnight in hour12:false mode — normalise to "00"
  const rawHour = get("hour");
  const hour = rawHour === "24" ? "00" : rawHour.padStart(2, "0");
  const minute = get("minute").padStart(2, "0");
  const second = get("second").padStart(2, "0");

  return `${month}/${day}/${year} ${hour}:${minute}:${second}`;
}

// ---------------------------------------------------------------------------
// Precise Row Targeting — Append-to-Bottom Fix
// ---------------------------------------------------------------------------

/**
 * Find the exact next empty row in a sheet by reading Column A,
 * then write the given values to that row using `values.update`.
 *
 * This avoids `values.append` which can skip over blank rows that
 * contain stray formatting or trailing commas.
 */
async function writeToNextRow(
  sheetName: string,
  values: string[][]
): Promise<void> {
  // 1. Fetch Column A to count filled rows
  const colAResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:A`,
  });

  const colAData = colAResponse.data.values || [];
  // Filter out rows where Column A is blank/empty
  const filledRows = colAData.filter(
    (row) => row[0] && row[0].toString().trim() !== ""
  );

  // 2. Calculate the target row (1-indexed: data starts after filled rows)
  const targetRow = filledRows.length + 1;

  // 3. Determine the column range based on the number of values
  const lastColLetter = String.fromCharCode(64 + values[0].length); // A=65, so 64+1=A, 64+13=M

  // 4. Write using values.update targeting the exact row
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A${targetRow}:${lastColLetter}${targetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });
}

/**
 * Write multiple rows starting at the next empty row.
 * Used by `returnUnits()` for batch operations.
 */
async function writeMultipleRows(
  sheetName: string,
  allValues: string[][]
): Promise<void> {
  const colAResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:A`,
  });

  const colAData = colAResponse.data.values || [];
  const filledRows = colAData.filter(
    (row) => row[0] && row[0].toString().trim() !== ""
  );

  const startRow = filledRows.length + 1;
  const endRow = startRow + allValues.length - 1;
  const lastColLetter = String.fromCharCode(64 + allValues[0].length);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A${startRow}:${lastColLetter}${endRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: allValues,
    },
  });
}

// ---------------------------------------------------------------------------
// Outbound (Loan) — Step 3 FOC Request
// ---------------------------------------------------------------------------

/**
 * Submit a new outbound FOC request (device loan to a KOL).
 *
 * Race-condition defense (Layer 1.5):
 *   1. Re-read Step 1 at submission time → verify the unit is still AVAILABLE.
 *   2. Cross-check the last 100 rows of Step 3 → detect near-simultaneous writes.
 *   3. Only then write a row to Step 3 using precise row targeting.
 *
 * Step 1 is NEVER written to — it is GET/Read only.
 */
export async function requestUnit(data: RequestPayload): Promise<ActionResult> {
  if (!(await isAuthenticated())) {
    return { success: false, error: "Unauthorized — please log in first." };
  }

  try {
    const validated = requestPayloadSchema.parse(data);

    const submittedImei = (validated.imeiIfAny || "").trim();

    // -----------------------------------------------------------------------
    // Layer 1.5  — Only run if an IMEI was actually selected (not "none")
    // -----------------------------------------------------------------------
    if (submittedImei && submittedImei !== "none") {
      // -- Step A: Re-read Step 1 and verify AVAILABLE ----------------------
      const step1Response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: SHEET_RANGES.DATA_BANK,
      });

      const step1Rows = step1Response.data.values;
      if (step1Rows && step1Rows.length > 1) {
        const step1Headers = (step1Rows[0] as string[]).map((h) =>
          h?.trim().toUpperCase() || ""
        );

        // Find the IMEI column (Column E/F area — serial number)
        const imeiColIdx = step1Headers.findIndex(
          (h) => h.includes("SERIAL NUMBER") || h.includes("IMEI")
        );
        // Find the Status Location column (Column M area)
        const statusColIdx = step1Headers.findIndex(
          (h) => h.includes("STATUS LOCATION")
        );

        if (imeiColIdx >= 0 && statusColIdx >= 0) {
          const matchingRow = step1Rows
            .slice(1)
            .find(
              (row) =>
                (row[imeiColIdx] || "").trim().toUpperCase() ===
                submittedImei.toUpperCase()
            );

          if (matchingRow) {
            const currentStatus = (matchingRow[statusColIdx] || "")
              .trim()
              .toUpperCase();
            if (!currentStatus.includes("AVAILABLE")) {
              return {
                success: false,
                error:
                  "This unit has just been taken by another PIC. Please select a different unit.",
              };
            }
          }
        }
      }

      // -- Step B: Cross-check Step 3 last 100 rows for collision ------------
      const step3Response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: SHEET_RANGES.FOC_REQUEST,
      });

      const step3Rows = step3Response.data.values;
      if (step3Rows && step3Rows.length > 1) {
        const step3Headers = (step3Rows[0] as string[]).map((h) =>
          h?.trim().toUpperCase() || ""
        );

        // Find IMEI column in Step 3
        const step3ImeiColIdx = step3Headers.findIndex(
          (h) => h.includes("IMEI") || h.includes("SERIAL")
        );

        if (step3ImeiColIdx >= 0) {
          // Check the last 100 rows (most recent submissions)
          const recentRows = step3Rows.slice(
            Math.max(1, step3Rows.length - 100)
          );
          const collision = recentRows.find(
            (row) =>
              (row[step3ImeiColIdx] || "").trim().toUpperCase() ===
              submittedImei.toUpperCase()
          );

          if (collision) {
            return {
              success: false,
              error:
                "Request collision detected. This unit was just processed milliseconds ago. Please select a different unit.",
            };
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // All checks passed — write the row to Step 3 using precise targeting
    // -----------------------------------------------------------------------
    const timestamp = formatTimestampGMT7();
    const emailAddress = `${validated.username}${EMAIL_DOMAIN}`;
    const finalRequestor =
      validated.requestor === "Other"
        ? validated.customRequestor || "Other"
        : validated.requestor;
    const finalCampaign =
      validated.campaignName === "Other"
        ? validated.customCampaign || "Other"
        : validated.campaignName;

    await writeToNextRow(SHEETS.FOC_REQUEST, [
      [
        timestamp,              // A: Timestamp
        emailAddress,           // B: Email Address
        finalRequestor,         // C: Requestor
        finalCampaign,          // D: Campaign Name
        validated.unitName,     // E: Unit Name
        validated.imeiIfAny || "", // F: IMEI if any
        validated.kolName,      // G: KOL Name
        validated.kolPhoneNumber, // H: KOL Phone Number
        validated.kolAddress,   // I: KOL address
        validated.deliveryDate, // J: Delivery Date
        validated.typeOfDelivery, // K: Type Of Delivery
        validated.typeOfFoc,    // L: Type of FOC
        "TRUE",                 // M: Deliver
      ],
    ]);

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

// ---------------------------------------------------------------------------
// Inbound (Return) — Step 4 FOC Return
// ---------------------------------------------------------------------------

/**
 * Submit an inbound FOC return (device coming back from a KOL).
 * Writes a row to the "Step 4 FOC Return" sheet using precise row targeting.
 *
 * @param data - Validated return payload from the form.
 * @returns ActionResult indicating success or failure with an error message.
 */
export async function returnUnit(data: ReturnPayload): Promise<ActionResult> {
  if (!(await isAuthenticated())) {
    return { success: false, error: "Unauthorized — please log in first." };
  }

  try {
    const validated = returnSchema.parse(data);

    const timestamp = formatTimestampGMT7();
    const emailAddress = `${validated.username}${EMAIL_DOMAIN}`;
    const finalRequestor =
      validated.requestor === "Other"
        ? validated.customRequestor || "Other"
        : validated.requestor;

    await writeToNextRow(SHEETS.FOC_RETURN, [
      [
        timestamp,                // A: Timestamp
        emailAddress,             // B: Email Address
        finalRequestor,           // C: Requestor
        validated.unitName,       // D: Unit Name
        validated.imei,           // E: IMEI/SN
        validated.fromKol,        // F: From KOL
        validated.kolAddress,     // G: KOL address
        validated.kolPhoneNumber, // H: KOL Phone Number
        validated.typeOfFoc,      // I: Type of FOC
        "",                       // J: Remarks (empty for normal returns)
      ],
    ]);

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

/**
 * Submit multiple inbound FOC returns (devices coming back from KOLs).
 * Writes multiple rows to the "Step 4 FOC Return" sheet using precise row targeting.
 *
 * @param data - Array of validated return payloads.
 * @returns ActionResult indicating success or failure with an error message.
 */
export async function returnUnits(dataArray: ReturnPayload[]): Promise<ActionResult> {
  if (!(await isAuthenticated())) {
    return { success: false, error: "Unauthorized — please log in first." };
  }

  if (!dataArray || dataArray.length === 0) {
    return { success: false, error: "No units provided for return." };
  }

  try {
    const valuesToWrite: string[][] = [];
    
    for (const data of dataArray) {
      const validated = returnSchema.parse(data);
      const timestamp = formatTimestampGMT7();
      const emailAddress = `${validated.username}${EMAIL_DOMAIN}`;
      const finalRequestor =
        validated.requestor === "Other"
          ? validated.customRequestor || "Other"
          : validated.requestor;

      valuesToWrite.push([
        timestamp,                // A: Timestamp
        emailAddress,             // B: Email Address
        finalRequestor,           // C: Requestor
        validated.unitName,       // D: Unit Name
        validated.imei,           // E: IMEI/SN
        validated.fromKol,        // F: From KOL
        validated.kolAddress,     // G: KOL address
        validated.kolPhoneNumber, // H: KOL Phone Number
        validated.typeOfFoc,      // I: Type of FOC
        "",                       // J: Remarks (empty for normal returns)
      ]);
    }

    await writeMultipleRows(SHEETS.FOC_RETURN, valuesToWrite);

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

// ---------------------------------------------------------------------------
// Transfer Between KOL — Double Append (Step 4 + Step 3)
// ---------------------------------------------------------------------------

/**
 * Transfer a device from one KOL to another.
 *
 * Strategy:
 *   1. Verify the IMEI is currently "LOANED / ON KOL" in Step 1 (read-only).
 *   2. Transaction A: Write to Step 4 (return from KOL 1).
 *   3. Transaction B: Write to Step 3 (issue to KOL 2).
 *   4. If Transaction A fails, Transaction B does NOT execute.
 *
 * Step 1 is NEVER written to.
 */
export async function transferUnit(data: TransferPayload): Promise<ActionResult> {
  if (!(await isAuthenticated())) {
    return { success: false, error: "Unauthorized — please log in first." };
  }

  try {
    const validated = transferPayloadSchema.parse(data);
    const submittedImei = validated.imei.trim();

    // -----------------------------------------------------------------------
    // Race-condition check: Verify the IMEI is still LOANED in Step 1
    // -----------------------------------------------------------------------
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

    // -----------------------------------------------------------------------
    // Build payloads
    // -----------------------------------------------------------------------
    const timestamp = formatTimestampGMT7();
    const emailAddress = `${validated.username}${EMAIL_DOMAIN}`;
    const finalRequestor =
      validated.requestor === "Other"
        ? validated.customRequestor || "Other"
        : validated.requestor;
    const finalCampaign =
      validated.campaignName === "Other"
        ? validated.customCampaign || "Other"
        : validated.campaignName;

    const remarksText = `Direct Transfer to ${validated.kol2Name} - ${finalCampaign}`;

    // -----------------------------------------------------------------------
    // Transaction A: Write to Step 4 FOC Return (return from KOL 1)
    // -----------------------------------------------------------------------
    try {
      await writeToNextRow(SHEETS.FOC_RETURN, [
        [
          timestamp,                // A: Timestamp
          emailAddress,             // B: Email Address
          finalRequestor,           // C: Requestor
          validated.unitName,       // D: Unit Name
          validated.imei,           // E: IMEI/SN
          validated.currentHolder,  // F: From KOL (KOL 1)
          "-",                      // G: KOL address
          "-",                      // H: KOL Phone Number
          validated.typeOfFoc,      // I: Type of FOC
          remarksText,              // J: Remarks
        ],
      ]);
    } catch (stepAError) {
      console.error("Transfer Step A (Return from KOL 1) failed", stepAError);
      return {
        success: false,
        error: "Failed to record the return from the current holder. Transfer aborted.",
      };
    }

    // -----------------------------------------------------------------------
    // Transaction B: Write to Step 3 FOC Request (issue to KOL 2)
    // Only executes if Transaction A succeeded
    // -----------------------------------------------------------------------
    try {
      await writeToNextRow(SHEETS.FOC_REQUEST, [
        [
          timestamp,                  // A: Timestamp
          emailAddress,               // B: Email Address
          finalRequestor,             // C: Requestor
          finalCampaign,              // D: Campaign Name (Transfer Reason)
          validated.unitName,         // E: Unit Name
          validated.imei,             // F: IMEI if any
          validated.kol2Name,         // G: KOL Name (KOL 2)
          validated.kol2Phone,        // H: KOL Phone Number
          validated.kol2Address,      // I: KOL address
          validated.transferDate,     // J: Delivery Date (Transfer Date)
          "Direct Transfer",          // K: Type Of Delivery
          validated.typeOfFoc,        // L: Type of FOC
          "TRUE",                     // M: Deliver
        ],
      ]);
    } catch (stepBError) {
      console.error("Transfer Step B (Issue to KOL 2) failed", stepBError);
      return {
        success: false,
        error: "Return from KOL 1 was recorded, but issuing to KOL 2 failed. Please manually create a request for the new KOL.",
      };
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
