import { describe, it, expect } from "vitest"
import {
  STEP1_COLS,
  STEP3_COLS,
  STEP4_COLS,
  EMAIL_DOMAIN,
  STATUS,
  FOC_TYPES,
} from "@/lib/constants"

describe("STEP1_COLS", () => {
  it("has correct positional indices for Step 1 Data Bank", () => {
    expect(STEP1_COLS.IMEI).toBe(4)
    expect(STEP1_COLS.UNIT_NAME).toBe(5)
    expect(STEP1_COLS.FOC_STATUS).toBe(6)
    expect(STEP1_COLS.STATUS_LOCATION).toBe(12)
    expect(STEP1_COLS.ON_HOLDER).toBe(13)
    expect(STEP1_COLS.GOAT_PIC).toBe(9)
    expect(STEP1_COLS.SEIN_PIC_NAME).toBe(2)
    expect(STEP1_COLS.PLANNED_RETURN).toBe(7)
    expect(STEP1_COLS.CAMPAIGN_NAME).toBe(10)
  })

  it("covers all 16 columns (0-15)", () => {
    const indices = Object.values(STEP1_COLS)
    expect(indices).toHaveLength(16)
    expect(Math.max(...indices)).toBe(15)
    expect(Math.min(...indices)).toBe(0)
  })
})

describe("STEP3_COLS", () => {
  it("has correct positional indices for Step 3 FOC Request", () => {
    expect(STEP3_COLS.TIMESTAMP).toBe(0)
    expect(STEP3_COLS.EMAIL).toBe(1)
    expect(STEP3_COLS.REQUESTOR).toBe(2)
    expect(STEP3_COLS.CAMPAIGN_NAME).toBe(3)
    expect(STEP3_COLS.UNIT_NAME).toBe(4)
    expect(STEP3_COLS.IMEI).toBe(5)
    expect(STEP3_COLS.KOL_NAME).toBe(6)
    expect(STEP3_COLS.KOL_PHONE).toBe(7)
    expect(STEP3_COLS.KOL_ADDRESS).toBe(8)
    expect(STEP3_COLS.DELIVERY_DATE).toBe(9)
    expect(STEP3_COLS.TYPE_OF_DELIVERY).toBe(10)
    expect(STEP3_COLS.TYPE_OF_FOC).toBe(11)
    expect(STEP3_COLS.DELIVER).toBe(12)
  })
})

describe("STEP4_COLS", () => {
  it("has correct positional indices for Step 4 FOC Return", () => {
    expect(STEP4_COLS.TIMESTAMP).toBe(0)
    expect(STEP4_COLS.EMAIL).toBe(1)
    expect(STEP4_COLS.REQUESTOR).toBe(2)
    expect(STEP4_COLS.UNIT_NAME).toBe(3)
    expect(STEP4_COLS.IMEI).toBe(4)
    expect(STEP4_COLS.FROM_KOL).toBe(5)
    expect(STEP4_COLS.KOL_ADDRESS).toBe(6)
    expect(STEP4_COLS.KOL_PHONE).toBe(7)
    expect(STEP4_COLS.TYPE_OF_FOC).toBe(8)
    expect(STEP4_COLS.REMARKS).toBe(9)
  })
})

describe("Form constants", () => {
  it("EMAIL_DOMAIN starts with @", () => {
    expect(EMAIL_DOMAIN).toMatch(/^@/)
  })

  it("STATUS has canonical values", () => {
    expect(STATUS.AVAILABLE).toBe("AVAILABLE")
    expect(STATUS.LOANED).toBe("LOANED / ON KOL")
    expect(STATUS.RETURN_TO_TCC).toBe("RETURN TO TCC")
  })

  it("FOC_TYPES are all uppercase", () => {
    FOC_TYPES.forEach((type) => {
      expect(type).toBe(type.toUpperCase())
    })
  })
})
