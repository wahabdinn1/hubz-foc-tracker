import { describe, it, expect } from "vitest";
import { requestPayloadSchema, returnSchema, transferPayloadSchema } from "@/lib/validations";

describe("requestPayloadSchema", () => {
    const validPayload = {
        username: "john.doe",
        requestor: "Aliya",
        customRequestor: "",
        campaignName: "Galaxy S25 FE Sustenance 2026",
        customCampaign: "",
        devices: [
            {
                unitName: "G-S25U-001",
                imeiIfAny: "",
                kolName: "Test KOL",
                kolAddress: "Jakarta",
                kolPhoneNumber: "081234567890",
                typeOfDelivery: "TIKI",
                typeOfFoc: "HANDPHONE",
                deliveryDate: "2026-01-15",
            },
        ],
    };

  it("validates a correct payload", () => {
    const result = requestPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects missing username", () => {
    const { username: _username, ...noUsername } = validPayload;
    const result = requestPayloadSchema.safeParse(noUsername);
    expect(result.success).toBe(false);
  });

  it("rejects empty required fields in device", () => {
    const result = requestPayloadSchema.safeParse({
      ...validPayload,
      devices: [{ ...validPayload.devices[0], kolName: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid deliveryDate format", () => {
    const result = requestPayloadSchema.safeParse({
      ...validPayload,
      devices: [{ ...validPayload.devices[0], deliveryDate: "15-01-2026" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields as empty", () => {
    const result = requestPayloadSchema.safeParse({
      ...validPayload,
      devices: [{ ...validPayload.devices[0], customRequestor: "", imeiIfAny: "" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty devices array", () => {
    const result = requestPayloadSchema.safeParse({ ...validPayload, devices: [] });
    expect(result.success).toBe(false);
  });

  it("validates multiple devices", () => {
    const result = requestPayloadSchema.safeParse({
      ...validPayload,
      devices: [
        validPayload.devices[0],
        {
          unitName: "G-A55-001",
          imeiIfAny: "123456789012345",
          kolName: "Another KOL",
          kolAddress: "Bandung",
          kolPhoneNumber: "089876543210",
          typeOfDelivery: "BLUEBIRD",
          typeOfFoc: "HANDPHONE",
          deliveryDate: "2026-02-01",
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("returnSchema", () => {
  const validPayload = {
    username: "john.doe",
    requestor: "Sulu",
    customRequestor: "",
    unitName: "G-S25U-001",
    imei: "123456789012345",
    fromKol: "Test KOL",
    kolAddress: "Jakarta",
    kolPhoneNumber: "081234567890",
    typeOfFoc: "HANDPHONE",
  };

  it("validates a correct payload", () => {
    const result = returnSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

    it("rejects missing IMEI", () => {
        const { imei: _, ...noImei } = validPayload;
        const result = returnSchema.safeParse(noImei);
        expect(result.success).toBe(false);
    });

  it("rejects empty required fields", () => {
    const result = returnSchema.safeParse({ ...validPayload, fromKol: "" });
    expect(result.success).toBe(false);
  });
});

describe("transferPayloadSchema", () => {
  const validPayload = {
    username: "john.doe",
    requestor: "Aliya",
    customRequestor: "",
    imei: "123456789012345",
    unitName: "G-S25U-001",
    typeOfFoc: "HANDPHONE",
    currentHolder: "Old KOL",
    kol2Name: "New KOL",
    kol2Phone: "081234567890",
    kol2Address: "Bandung",
    campaignName: "Ramadan 2026",
    customCampaign: "",
    transferDate: "2026-02-01",
  };

  it("validates a correct payload", () => {
    const result = transferPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects invalid transferDate format", () => {
    const result = transferPayloadSchema.safeParse({ ...validPayload, transferDate: "01/02/2026" });
    expect(result.success).toBe(false);
  });

    it("rejects missing required fields", () => {
        const { kol2Name: _, ...noKol2 } = validPayload;
        const result = transferPayloadSchema.safeParse(noKol2);
        expect(result.success).toBe(false);
    });
});
