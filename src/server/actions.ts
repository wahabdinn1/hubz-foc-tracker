"use server";

import { sheets } from "./google";
import { cookies } from "next/headers";
import { unstable_cache, revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { SignJWT } from "jose";
import { isAuthenticated } from "@/lib/auth";
import { requestPayloadSchema, returnSchema, RequestPayload, ReturnPayload } from "@/lib/validations";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export interface InventoryItem {
    imei: string;
    unitName: string;
    focStatus: string;
    goatPic: string;
    seinPic: string;
    statusLocation: string;
    onHolder: string;
    plannedReturnDate: string;
    campaignName: string;
    fullData: Record<string, string>;
}

export const getInventory = unstable_cache(
    async (): Promise<InventoryItem[]> => {
        try {
            const response = await sheets.spreadsheets.values.batchGet({
                spreadsheetId: SHEET_ID,
                ranges: ["Step 1 Data Bank!A:O", "Step 3 FOC Request!A:H"],
            });

            const rows = response.data.valueRanges?.[0].values;
            const reqRows = response.data.valueRanges?.[1].values;

            if (!rows || rows.length <= 1) {
                throw new Error("No inventory data found or only headers present.");
            }

            const headers = (rows[0] as string[]).map(h => h?.trim() || "Unknown Column");
            // Build a lookup map: header name -> column index
            const colIndex = (name: string): number =>
                headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

            // Map Request Dates from Step 3 dynamically by header
            const requestDates = new Map<string, string>();
            if (reqRows && reqRows.length > 1) {
                const reqHeaders = (reqRows[0] as string[]).map(h => h?.trim() || "Unknown");
                const reqColIndex = (name: string): number => reqHeaders.findIndex(h => h.toLowerCase() === name.toLowerCase());

                const timeIdx = reqColIndex("Timestamp");
                const unitIdx = reqColIndex("Unit Name");
                const imeiIdx = reqColIndex("IMEI");
                const kolIdx = reqColIndex("KOL Name");

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
            }

            // Skip the first row (headers)
            return rows.slice(1).map((row) => {
                const fullData: Record<string, string> = {};
                headers.forEach((header, index) => {
                    if (header) {
                        fullData[header] = row[index] || "-";
                    }
                });

                const col = (name: string) => {
                    const idx = colIndex(name);
                    return idx >= 0 ? (row[idx] || "") : "";
                };

                const imei = col("IMEI") || row[3] || "";
                const unitName = col("Unit Name") || row[4] || "";
                const kol = col("ON HOLDER") || row[12] || "";

                // Resolve the Request Date from Step 3
                let reqDate = "";
                if (imei && imei.trim() !== "" && imei.trim() !== "-") {
                    reqDate = requestDates.get(imei.trim()) || "";
                }
                if (!reqDate && unitName && kol) {
                    reqDate = requestDates.get(`${unitName.trim()}||${kol.trim()}`) || "";
                }
                if (!reqDate) {
                    reqDate = fullData["Timestamp"] || fullData["Date Received"] || fullData["Request Date"] || "-";
                }

                fullData["Step 3 Request Date"] = reqDate;

                return {
                    imei,
                    unitName,
                    focStatus: col("RETURN / UNRETURN") || row[5] || "",
                    goatPic: col("PIC GOAT") || row[8] || "",
                    seinPic: col("PIC SEIN") || row[2] || "",
                    statusLocation: col("STATUS LOCATION") || row[11] || "",
                    onHolder: kol,
                    plannedReturnDate: col("Planned Return Date") || row[6] || "",
                    campaignName: col("Campaign Name") || row[9] || "",
                    fullData,
                };
            });
        } catch (error) {
            console.error("Failed to fetch inventory", error);
            throw new Error(error instanceof Error ? error.message : "Failed to fetch inventory from Google Sheets");
        }
    },
    ['inventory-data'],
    { revalidate: 30 }
);

export async function requestUnit(data: RequestPayload) {
    // Auth gate: reject unauthenticated callers
    if (!(await isAuthenticated())) {
        return { success: false, error: "Unauthorized — please log in first." };
    }

    try {
        const validated = requestPayloadSchema.parse(data);

        const timestamp = new Date().toLocaleString('id-ID');
        const emailAddress = `${validated.username}@wppmedia.com`;
        const finalRequestor = validated.requestor === "Other"
            ? (validated.customRequestor || "Other")
            : validated.requestor;

        // Append a new row to "Step 3 FOC Request"
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: "Step 3 FOC Request",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[
                    timestamp,
                    emailAddress,
                    finalRequestor,
                    validated.campaignName,
                    validated.unitName,
                    validated.imeiIfAny || "",
                    validated.kolName,
                    validated.kolAddress,
                    validated.kolPhoneNumber,
                    validated.deliveryDate,
                    validated.typeOfDelivery,
                    validated.typeOfFoc
                ]],
            },
        });

        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error("Failed to append request", error);
        if (error instanceof z.ZodError) {
            return { success: false, error: (error as any).errors[0]?.message || "Validation failed" };
        }
        return { success: false, error: "Failed to request unit due to a server error." };
    }
}

export async function returnUnit(data: ReturnPayload) {
    // Auth gate: reject unauthenticated callers
    if (!(await isAuthenticated())) {
        return { success: false, error: "Unauthorized — please log in first." };
    }

    try {
        const validated = returnSchema.parse(data);

        const timestamp = new Date().toLocaleString('id-ID');
        const emailAddress = `${validated.username}@wppmedia.com`;
        const finalRequestor = validated.requestor === "Other"
            ? (validated.customRequestor || "Other")
            : validated.requestor;

        // Append a new row to "Step 4 FOC Return"
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: "Step 4 FOC Return",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[
                    timestamp,
                    emailAddress,
                    finalRequestor,
                    validated.unitName,
                    validated.imei,
                    validated.fromKol,
                    validated.kolAddress,
                    validated.kolPhoneNumber,
                    validated.typeOfFoc
                ]],
            },
        });

        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error("Failed to append return", error);
        if (error instanceof z.ZodError) {
            return { success: false, error: (error as any).errors[0]?.message || "Validation failed" };
        }
        return { success: false, error: "Failed to return unit due to a server error." };
    }
}

export async function verifyPin(inputPin: string) {
    const { isRateLimited, recordFailedAttempt, clearAttempts, getRemainingAttempts } = await import("@/lib/rate-limit");

    // Use a static key for rate limiting (in production, use client IP from headers)
    const rateLimitKey = "pin-global";

    // Check rate limit first
    if (await isRateLimited(rateLimitKey)) {
        return { success: false, error: "Too many failed attempts. Please try again in 15 minutes." };
    }

    const authorizedPins = process.env.AUTHORIZED_PINS?.split(",") || [];

    if (authorizedPins.includes(inputPin)) {
        // Prefer JWT_SECRET, fall back to GOOGLE_PRIVATE_KEY for backwards compatibility
        const key = process.env.JWT_SECRET || process.env.GOOGLE_PRIVATE_KEY;
        if (!key) {
            return { success: false, error: "Server misconfigured — signing key missing." };
        }
        const secret = new TextEncoder().encode(key);
        const jwt = await new SignJWT({ role: "authorized" })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("24h")
            .sign(secret);

        // Clear rate limit on success
        await clearAttempts(rateLimitKey);

        // Set an HTTP-only cookie with sameSite protection
        const cookieStore = await cookies();
        cookieStore.set("foc_auth_token", jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });
        return { success: true };
    }

    // Record failed attempt and return remaining count
    await recordFailedAttempt(rateLimitKey);
    const remaining = await getRemainingAttempts(rateLimitKey);

    return {
        success: false,
        error: remaining > 0
            ? `Invalid PIN. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Too many failed attempts. Please try again in 15 minutes."
    };
}

export async function revalidateInventory() {
    revalidatePath('/', 'layout');
    return { success: true };
}

