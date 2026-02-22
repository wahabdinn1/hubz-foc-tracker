"use server";

import { sheets } from "./google";
import { cookies } from "next/headers";
import { unstable_cache, revalidatePath } from "next/cache";
import { z } from "zod";
import { SignJWT } from "jose";

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
    fullData: Record<string, string>;
}

export const getInventory = unstable_cache(
    async (): Promise<InventoryItem[]> => {
        try {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: "Step 1 Data Bank!A:O",
            });

            const rows = response.data.values;
            if (!rows || rows.length <= 1) return [];

            const headers = (rows[0] as string[]).map(h => h?.trim() || "Unknown Column");

            // Build a lookup map: header name -> column index
            const colIndex = (name: string): number =>
                headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

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

                return {
                    imei: col("IMEI") || row[3] || "",
                    unitName: col("Unit Name") || row[4] || "",
                    focStatus: col("RETURN / UNRETURN") || row[5] || "",
                    goatPic: col("PIC GOAT") || row[8] || "",
                    seinPic: col("PIC SEIN") || row[2] || "",
                    statusLocation: col("STATUS LOCATION") || row[11] || "",
                    onHolder: col("ON HOLDER") || row[12] || "",
                    plannedReturnDate: col("Planned Return Date") || row[6] || "",
                    fullData,
                };
            });
        } catch (error) {
            console.error("Failed to fetch inventory", error);
            return [];
        }
    },
    ['inventory-data'],
    { revalidate: 30 }
);

const RequestSchema = z.object({
    username: z.string().min(1, "Username is required"),
    requestor: z.string().min(1, "Requestor is required"),
    customRequestor: z.string().optional(),
    campaignName: z.string().min(1, "Campaign Name is required"),
    unitName: z.string().min(1, "Unit Name is required"),
    imeiIfAny: z.string().optional(),
    kolName: z.string().min(1, "KOL Name is required"),
    kolAddress: z.string().min(1, "KOL Address is required"),
    kolPhoneNumber: z.string().min(1, "KOL Phone Number is required"),
    deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    typeOfDelivery: z.string().min(1, "Type of Delivery is required"),
    typeOfFoc: z.string().min(1, "Type of FOC is required"),
});

export type RequestPayload = z.infer<typeof RequestSchema>;

export async function requestUnit(data: RequestPayload) {
    try {
        const validated = RequestSchema.parse(data);

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
        return { success: true };
    } catch (error) {
        console.error("Failed to append request", error);
        if (error instanceof z.ZodError) {
            const zodErr = error as any;
            return { success: false, error: zodErr.errors[0].message };
        }
        return { success: false, error: "Failed to request unit" };
    }
}

const ReturnSchema = z.object({
    username: z.string().min(1, "Username is required"),
    requestor: z.string().min(1, "Requestor is required"),
    customRequestor: z.string().optional(),
    unitName: z.string().min(1, "Unit Name is required"),
    imei: z.string().min(1, "IMEI is required"),
    fromKol: z.string().min(1, "From KOL is required"),
    kolAddress: z.string().min(1, "KOL Address is required"),
    kolPhoneNumber: z.string().min(1, "KOL Phone Number is required"),
    typeOfFoc: z.string().min(1, "Type of FOC is required"),
});

export type ReturnPayload = z.infer<typeof ReturnSchema>;

export async function returnUnit(data: ReturnPayload) {
    try {
        const validated = ReturnSchema.parse(data);

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
        return { success: true };
    } catch (error) {
        console.error("Failed to append return", error);
        if (error instanceof z.ZodError) {
            const zodErr = error as any;
            return { success: false, error: zodErr.errors[0].message };
        }
        return { success: false, error: "Failed to return unit" };
    }
}

export async function verifyPin(inputPin: string) {
    const authorizedPins = process.env.AUTHORIZED_PINS?.split(",") || [];

    if (authorizedPins.includes(inputPin)) {
        const secret = new TextEncoder().encode(process.env.GOOGLE_PRIVATE_KEY || "fallback_secret");
        const jwt = await new SignJWT({ role: "authorized" })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("24h")
            .sign(secret);

        // Set an HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set("foc_auth_token", jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });
        return { success: true };
    }

    return { success: false, error: "Invalid PIN" };
}

export async function revalidateInventory() {
    revalidatePath('/', 'layout');
    return { success: true };
}
