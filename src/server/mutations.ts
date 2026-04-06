"use server";

import { sheets } from "./google";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAuthenticated } from "@/lib/auth";
import {
  requestPayloadSchema,
  returnSchema,
  type RequestPayload,
  type ReturnPayload,
} from "@/lib/validations";
import { SHEET_RANGES, EMAIL_DOMAIN } from "@/lib/constants";
import type { ActionResult } from "@/types/inventory";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

/**
 * Format a Date as `M/d/yyyy HH:mm:ss` — e.g. `6/4/2026 05:01:30`.
 * The Google Sheet expects this exact pattern (no comma, colon-separated time).
 */
function formatTimestamp(date: Date): string {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${m}/${d}/${y} ${hh}:${mm}:${ss}`;
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
 *   3. Only then append a row to Step 3.
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
    // All checks passed — append the row to Step 3
    // -----------------------------------------------------------------------
    const timestamp = formatTimestamp(new Date());
    const emailAddress = `${validated.username}${EMAIL_DOMAIN}`;
    const finalRequestor =
      validated.requestor === "Other"
        ? validated.customRequestor || "Other"
        : validated.requestor;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGES.FOC_REQUEST,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            timestamp,
            emailAddress,
            finalRequestor,
            validated.campaignName,
            validated.unitName,
            validated.imeiIfAny || "",
            validated.kolName,
            validated.kolPhoneNumber,
            validated.kolAddress,
            validated.deliveryDate,
            validated.typeOfDelivery,
            validated.typeOfFoc,
          ],
        ],
      },
    });

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
 * Appends a row to the "Step 4 FOC Return" sheet.
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

    const timestamp = formatTimestamp(new Date());
    const emailAddress = `${validated.username}${EMAIL_DOMAIN}`;
    const finalRequestor =
      validated.requestor === "Other"
        ? validated.customRequestor || "Other"
        : validated.requestor;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGES.FOC_RETURN,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
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
          ],
        ],
      },
    });

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
