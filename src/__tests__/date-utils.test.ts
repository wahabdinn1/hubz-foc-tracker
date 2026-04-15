import { describe, it, expect } from "vitest";
import { isItemOverdue, getReturnUrgency } from "@/lib/date-utils";

describe("isItemOverdue", () => {
  it("returns false when focStatus is not RETURN", () => {
    expect(isItemOverdue({ focStatus: "UNRETURN", statusLocation: "LOANED / ON KOL", plannedReturnDate: "1/1/2020" })).toBe(false);
  });

  it("returns false when statusLocation is not LOANED", () => {
    expect(isItemOverdue({ focStatus: "RETURN", statusLocation: "AVAILABLE", plannedReturnDate: "1/1/2020" })).toBe(false);
  });

  it("returns false when plannedReturnDate is ASAP", () => {
    expect(isItemOverdue({ focStatus: "RETURN", statusLocation: "LOANED / ON KOL", plannedReturnDate: "ASAP" })).toBe(false);
  });

  it("returns false when plannedReturnDate is N/A", () => {
    expect(isItemOverdue({ focStatus: "RETURN", statusLocation: "LOANED / ON KOL", plannedReturnDate: "N/A" })).toBe(false);
  });

  it("returns false when plannedReturnDate is empty", () => {
    expect(isItemOverdue({ focStatus: "RETURN", statusLocation: "LOANED / ON KOL", plannedReturnDate: "" })).toBe(false);
  });

  it("returns true when return date is in the past", () => {
    const pastDate = new Date(2020, 0, 1);
    const dateStr = `${pastDate.getMonth() + 1}/${pastDate.getDate()}/${pastDate.getFullYear()}`;
    expect(isItemOverdue({ focStatus: "RETURN", statusLocation: "LOANED / ON KOL", plannedReturnDate: dateStr })).toBe(true);
  });

  it("returns false when return date is in the future", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const dateStr = `${futureDate.getMonth() + 1}/${futureDate.getDate()}/${futureDate.getFullYear()}`;
    expect(isItemOverdue({ focStatus: "RETURN", statusLocation: "LOANED / ON KOL", plannedReturnDate: dateStr })).toBe(false);
  });

  it("returns false for undefined values", () => {
    expect(isItemOverdue({})).toBe(false);
    expect(isItemOverdue({ focStatus: undefined, statusLocation: undefined, plannedReturnDate: undefined })).toBe(false);
  });
});

describe("getReturnUrgency", () => {
  it("returns null for empty string", () => {
    expect(getReturnUrgency("")).toBeNull();
  });

  it("returns null for dash", () => {
    expect(getReturnUrgency("-")).toBeNull();
  });

  it("returns null for N/A", () => {
    expect(getReturnUrgency("N/A")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(getReturnUrgency(undefined)).toBeNull();
  });

  it("returns ASAP label for ASAP", () => {
    const result = getReturnUrgency("ASAP");
    expect(result).not.toBeNull();
    expect(result!.label).toBe("ASAP");
    expect(result!.color).toBe("text-red-500");
  });

  it("returns overdue label for past date", () => {
    const pastDate = new Date(2020, 0, 1);
    const dateStr = `${pastDate.getMonth() + 1}/${pastDate.getDate()}/${pastDate.getFullYear()}`;
    const result = getReturnUrgency(dateStr);
    expect(result).not.toBeNull();
    expect(result!.label).toContain("overdue");
    expect(result!.color).toBe("text-red-500");
  });

  it("returns remaining label for future date", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20);
    const dateStr = `${futureDate.getMonth() + 1}/${futureDate.getDate()}/${futureDate.getFullYear()}`;
    const result = getReturnUrgency(dateStr);
    expect(result).not.toBeNull();
    expect(result!.label).toContain("remaining");
    expect(result!.color).toBe("text-emerald-500");
  });
});
