import * as z from "zod";

// --- REQUEST (OUTBOUND) SCHEMAS ---

// Used by the client-side React Hook Form (handles actual Date objects from shadcn Calendar)
export const requestFormSchema = z.object({
    username: z.string().min(1, "Username is required"),
    requestor: z.string().min(1, "Requestor is required"),
    customRequestor: z.string().optional(),
    campaignName: z.string().min(1, "Campaign Name is required"),
    customCampaign: z.string().optional(),
    unitName: z.string().min(1, "Unit Name is required"),
    imeiIfAny: z.string().optional(),
    kolName: z.string().min(1, "KOL Name is required"),
    kolAddress: z.string().min(1, "KOL Address is required"),
    kolPhoneNumber: z.string().min(1, "KOL Phone Number is required"),
    deliveryDate: z.date(),
    typeOfDelivery: z.string().min(1, "Type of Delivery is required"),
    typeOfFoc: z.string().min(1, "Type of FOC is required"),
});

// Used by the server action (Date is serialized to string over the network)
export const requestPayloadSchema = z.object({
    username: z.string().min(1, "Username is required"),
    requestor: z.string().min(1, "Requestor is required"),
    customRequestor: z.string().optional(),
    campaignName: z.string().min(1, "Campaign Name is required"),
    customCampaign: z.string().optional(),
    unitName: z.string().min(1, "Unit Name is required"),
    imeiIfAny: z.string().optional(),
    kolName: z.string().min(1, "KOL Name is required"),
    kolAddress: z.string().min(1, "KOL Address is required"),
    kolPhoneNumber: z.string().min(1, "KOL Phone Number is required"),
    deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    typeOfDelivery: z.string().min(1, "Type of Delivery is required"),
    typeOfFoc: z.string().min(1, "Type of FOC is required"),
});

export type RequestPayload = z.infer<typeof requestPayloadSchema>;

// --- RETURN (INBOUND) SCHEMAS ---

// Used by both client and server (no complex objects like Date)
export const returnSchema = z.object({
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

export type ReturnPayload = z.infer<typeof returnSchema>;

// --- TRANSFER (KOL-TO-KOL) SCHEMAS ---

// Client-side: uses Date object for the calendar picker
export const transferFormSchema = z.object({
    username: z.string().min(1, "Username is required"),
    requestor: z.string().min(1, "Requestor is required"),
    customRequestor: z.string().optional(),
    imei: z.string().min(1, "IMEI is required"),
    unitName: z.string().min(1, "Unit Name is required"),
    typeOfFoc: z.string().min(1, "Type of FOC is required"),
    currentHolder: z.string().min(1, "Current holder is required"),
    kol2Name: z.string().min(1, "KOL 2 Name is required"),
    kol2Phone: z.string().min(1, "KOL 2 Phone is required"),
    kol2Address: z.string().min(1, "KOL 2 Address is required"),
    transferDate: z.date({ error: "Transfer Date is required" }),
    campaignName: z.string().min(1, "Transfer reason/campaign is required"),
    customCampaign: z.string().optional(),
});

// Server-side: Date serialized to string
export const transferPayloadSchema = z.object({
    username: z.string().min(1, "Username is required"),
    requestor: z.string().min(1, "Requestor is required"),
    customRequestor: z.string().optional(),
    imei: z.string().min(1, "IMEI is required"),
    unitName: z.string().min(1, "Unit Name is required"),
    typeOfFoc: z.string().min(1, "Type of FOC is required"),
    currentHolder: z.string().min(1, "Current holder is required"),
    kol2Name: z.string().min(1, "KOL 2 Name is required"),
    kol2Phone: z.string().min(1, "KOL 2 Phone is required"),
    kol2Address: z.string().min(1, "KOL 2 Address is required"),
    transferDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    campaignName: z.string().min(1, "Transfer reason/campaign is required"),
    customCampaign: z.string().optional(),
});

export type TransferPayload = z.infer<typeof transferPayloadSchema>;
