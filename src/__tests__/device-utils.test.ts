import { describe, it, expect } from "vitest"
import { getDeviceCategory } from "@/features/inventory/utils"

describe("getDeviceCategory", () => {
  it("categorizes S Series devices", () => {
    expect(getDeviceCategory("G-S25 Ultra")).toBe("S Series")
  })

  it("categorizes A Series devices", () => {
    expect(getDeviceCategory("G-A55 5G")).toBe("A Series")
  })

  it("categorizes Tab devices", () => {
    expect(getDeviceCategory("G-T970")).toBe("Tab")
  })

  it("categorizes Buds devices", () => {
    expect(getDeviceCategory("G-B3 Pro")).toBe("Buds")
  })

  it("categorizes Wearable devices", () => {
    expect(getDeviceCategory("G-W5 Pro")).toBe("Wearable")
  })

  it("falls back to Others for unknown prefixes", () => {
    expect(getDeviceCategory("Unknown Device")).toBe("Others")
  })

  it("falls back to Others for empty string", () => {
    expect(getDeviceCategory("")).toBe("Others")
  })
})
