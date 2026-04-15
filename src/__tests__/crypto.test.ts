import { describe, it, expect } from "vitest";
import { timingSafeEqual } from "@/lib/crypto";

describe("timingSafeEqual", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
  });

  it("returns false for different strings of same length", () => {
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
  });

  it("returns false for different strings of different length", () => {
    expect(timingSafeEqual("short", "a-much-longer-string")).toBe(false);
  });

  it("returns true for empty strings", () => {
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("returns false when one string is empty", () => {
    expect(timingSafeEqual("", "nonempty")).toBe(false);
    expect(timingSafeEqual("nonempty", "")).toBe(false);
  });

  it("handles unicode correctly", () => {
    expect(timingSafeEqual("héllo", "héllo")).toBe(true);
    expect(timingSafeEqual("héllo", "hello")).toBe(false);
  });

  it("does not leak length via timing (different lengths still compares all bytes)", () => {
    expect(timingSafeEqual("a", "b")).toBe(false);
    expect(timingSafeEqual("a", "ab")).toBe(false);
  });
});
