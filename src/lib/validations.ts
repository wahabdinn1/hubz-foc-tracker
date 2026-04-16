import * as z from "zod";

// --- REQUEST (OUTBOUND) SCHEMAS ---

const requestSharedBase = {
  username: z.string().min(1, "Username is required"),
  requestor: z.string().min(1, "Requestor is required"),
  customRequestor: z.string().optional(),
  campaignName: z.string().min(1, "Campaign Name is required"),
  customCampaign: z.string().optional(),
};

const requestDeviceItem = {
  unitName: z.string().min(1, "Unit Name is required"),
  imeiIfAny: z.string().optional(),
  kolName: z.string().min(1, "KOL Name is required"),
  kolAddress: z.string().min(1, "KOL Address is required"),
  kolPhoneNumber: z.string().min(1, "KOL Phone Number is required"),
  typeOfDelivery: z.string().min(1, "Type of Delivery is required"),
  typeOfFoc: z.string().min(1, "Type of FOC is required"),
};

export const requestFormSchema = z.object({
  ...requestSharedBase,
  devices: z.array(z.object({
    ...requestDeviceItem,
    deliveryDate: z.date(),
  })).min(1, "Add at least one device"),
});

export const requestPayloadSchema = z.object({
  ...requestSharedBase,
  devices: z.array(z.object({
    ...requestDeviceItem,
    deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  })).min(1),
});

export type RequestPayload = z.infer<typeof requestPayloadSchema>;

// --- RETURN (INBOUND) SCHEMAS ---

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

const transferBase = {
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
  campaignName: z.string().min(1, "Transfer reason/campaign is required"),
  customCampaign: z.string().optional(),
};

export const transferFormSchema = z.object({
  ...transferBase,
  transferDate: z.date({ error: "Transfer Date is required" }),
});

export const transferPayloadSchema = z.object({
  ...transferBase,
  transferDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export type TransferPayload = z.infer<typeof transferPayloadSchema>;
