import { describe, it, expect } from "vitest"
import { resolveFocTypeWithMatch } from "@/lib/form-utils"

describe("resolveFocTypeWithMatch", () => {
  it("matches predefined FOC type case-insensitively", () => {
    const result = resolveFocTypeWithMatch("handphone")
    expect(result).toBe("HANDPHONE")
  })

  it("returns the raw type if not in FOC_TYPES", () => {
    const result = resolveFocTypeWithMatch("CUSTOM")
    expect(result).toBe("CUSTOM")
  })

  it("returns empty string for dash", () => {
    expect(resolveFocTypeWithMatch("-")).toBe("")
  })

  it("returns empty string for empty input", () => {
    expect(resolveFocTypeWithMatch("")).toBe("")
  })
})
