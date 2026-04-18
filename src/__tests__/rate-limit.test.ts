import { describe, it, expect, beforeEach } from "vitest";
import {
  isRateLimited,
  recordFailedAttempt,
  clearAttempts,
  getRemainingAttempts,
} from "@/lib/rate-limit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    clearAttempts("test-key");
  });

  it("starts as not rate limited", async () => {
    expect(await isRateLimited("test-key")).toBe(false);
  });

  it("returns MAX_ATTEMPTS remaining initially", async () => {
    expect(await getRemainingAttempts("test-key")).toBe(5);
  });

  it("decrements remaining attempts after failures", async () => {
    await recordFailedAttempt("test-key");
    expect(await getRemainingAttempts("test-key")).toBe(4);

    await recordFailedAttempt("test-key");
    expect(await getRemainingAttempts("test-key")).toBe(3);
  });

  it("becomes rate limited after MAX_ATTEMPTS failures", async () => {
    for (let i = 0; i < 5; i++) {
      await recordFailedAttempt("test-key");
    }
    expect(await isRateLimited("test-key")).toBe(true);
    expect(await getRemainingAttempts("test-key")).toBe(0);
  });

  it("clears attempts and resets", async () => {
    for (let i = 0; i < 3; i++) {
      await recordFailedAttempt("test-key");
    }
    await clearAttempts("test-key");
    expect(await isRateLimited("test-key")).toBe(false);
    expect(await getRemainingAttempts("test-key")).toBe(5);
  });

  it("separates rate limits by key", async () => {
    for (let i = 0; i < 5; i++) {
      await recordFailedAttempt("test-key-1");
    }
    expect(await isRateLimited("test-key-1")).toBe(true);
    expect(await isRateLimited("test-key-2")).toBe(false);
  });
});
