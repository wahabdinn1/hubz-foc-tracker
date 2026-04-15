import { describe, it, expect } from "vitest";
import {
  isStatusAvailable,
  isStatusLoaned,
  isStatusReturnToTcc,
} from "@/lib/constants";

describe("isStatusAvailable", () => {
  it("returns true for AVAILABLE", () => {
    expect(isStatusAvailable("AVAILABLE")).toBe(true);
  });

  it("returns true for case-insensitive match", () => {
    expect(isStatusAvailable("available")).toBe(true);
    expect(isStatusAvailable("Available")).toBe(true);
  });

  it("returns true when AVAILABLE is a substring", () => {
    expect(isStatusAvailable("AVAILABLE IN LOCKER")).toBe(true);
  });

  it("returns false for non-available", () => {
    expect(isStatusAvailable("LOANED / ON KOL")).toBe(false);
    expect(isStatusAvailable("RETURN TO TCC")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isStatusAvailable(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isStatusAvailable("")).toBe(false);
  });
});

describe("isStatusLoaned", () => {
  it("returns true for LOANED / ON KOL", () => {
    expect(isStatusLoaned("LOANED / ON KOL")).toBe(true);
  });

  it("returns true for LOANED alone", () => {
    expect(isStatusLoaned("LOANED")).toBe(true);
  });

  it("returns true for ON KOL alone", () => {
    expect(isStatusLoaned("ON KOL")).toBe(true);
  });

  it("returns true for case-insensitive match", () => {
    expect(isStatusLoaned("loaned / on kol")).toBe(true);
    expect(isStatusLoaned("Loaned")).toBe(true);
  });

  it("returns false for AVAILABLE", () => {
    expect(isStatusLoaned("AVAILABLE")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isStatusLoaned(undefined)).toBe(false);
  });
});

describe("isStatusReturnToTcc", () => {
  it("returns true for RETURN TO TCC", () => {
    expect(isStatusReturnToTcc("RETURN TO TCC")).toBe(true);
  });

  it("returns true for case-insensitive match", () => {
    expect(isStatusReturnToTcc("return to tcc")).toBe(true);
  });

  it("returns false for other statuses", () => {
    expect(isStatusReturnToTcc("AVAILABLE")).toBe(false);
    expect(isStatusReturnToTcc("LOANED / ON KOL")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isStatusReturnToTcc(undefined)).toBe(false);
  });
});
