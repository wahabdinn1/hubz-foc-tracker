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
import { SHEETS, EMAIL_DOMAIN } from "@/lib/constants";
import type { ActionResult } from "@/types/inventory";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// ---------------------------------------------------------------------------
// Outbound (Loan) — Step 3 FOC Request
// ---------------------------------------------------------------------------

/**
 * Submit a new outbound FOC request (device loan to a KOL).
 * Appends a row to the "Step 3 FOC Request" sheet.
 *
 * @param data - Validated request payload from the form.
 * @returns ActionResult indicating success or failure with an error message.
 */
export async function requestUnit(data: RequestPayload): Promise<ActionResult> {
  if (!(await isAuthenticated())) {
    return { success: false, error: "Unauthorized — please log in first." };
  }

  try {
    const validated = requestPayloadSchema.parse(data);

    const timestamp = new Date().toLocaleString("id-ID");
    const emailAddress = `${validated.username}${EMAIL_DOMAIN}`;
    const finalRequestor =
      validated.requestor === "Other"
        ? validated.customRequestor || "Other"
        : validated.requestor;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SHEETS.FOC_REQUEST,
      valueInputOption: "USER_ENTERED",
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

    const timestamp = new Date().toLocaleString("id-ID");
    const emailAddress = `${validated.username}${EMAIL_DOMAIN}`;
    const finalRequestor =
      validated.requestor === "Other"
        ? validated.customRequestor || "Other"
        : validated.requestor;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SHEETS.FOC_RETURN,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            timestamp,
            emailAddress,
            finalRequestor,
            validated.unitName,
            validated.imei,
            validated.fromKol,
            validated.kolPhoneNumber,
            validated.kolAddress,
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
