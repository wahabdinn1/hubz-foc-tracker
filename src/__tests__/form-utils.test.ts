import { describe, it, expect } from "vitest"
import { resolveRequestorWithFallback, resolveFocTypeWithMatch } from "@/lib/form-utils"

describe("resolveRequestorWithFallback", () => {
  it("matches predefined requestor case-insensitively", () => {
    const result = resolveRequestorWithFallback("Abigail")
    expect(result.requestor).toBe("Abigail")
    expect(result.customRequestor).toBe("")
  })

  it("matches lowercase predefined requestor", () => {
    const result = resolveRequestorWithFallback("sulu")
    expect(result.requestor).toBe("Sulu")
    expect(result.customRequestor).toBe("")
  })

  it("falls back to Other with customRequestor for unknown names", () => {
    const result = resolveRequestorWithFallback("John Doe")
    expect(result.requestor).toBe("Other")
    expect(result.customRequestor).toBe("John Doe")
  })

  it("returns empty strings for empty input", () => {
    const result = resolveRequestorWithFallback("")
    expect(result.requestor).toBe("")
    expect(result.customRequestor).toBe("")
  })
})

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
