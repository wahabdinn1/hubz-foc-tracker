"use server";

import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { AUTH_COOKIE_NAME, JWT_EXPIRATION, COOKIE_MAX_AGE } from "@/lib/constants";
import type { ActionResult } from "@/types/inventory";

// ---------------------------------------------------------------------------
// PIN Verification
// ---------------------------------------------------------------------------

/**
 * Verify a 6-digit PIN against the authorized list.
 *
 * On success, signs a JWT and sets it as an HTTP-only cookie.
 * On failure, records the attempt for rate-limiting purposes.
 *
 * @param inputPin - The PIN string entered by the user.
 * @returns ActionResult with success status and optional error message.
 */
export async function verifyPin(inputPin: string): Promise<ActionResult> {
  const { isRateLimited, recordFailedAttempt, clearAttempts, getRemainingAttempts } =
    await import("@/lib/rate-limit");

  const rateLimitKey = "pin-global";

  if (await isRateLimited(rateLimitKey)) {
    return {
      success: false,
      error: "Too many failed attempts. Please try again in 15 minutes.",
    };
  }

  const authorizedPins = process.env.AUTHORIZED_PINS?.split(",") || [];

  if (authorizedPins.includes(inputPin)) {
    const key = process.env.JWT_SECRET || process.env.GOOGLE_PRIVATE_KEY;
    if (!key) {
      return {
        success: false,
        error: "Server misconfigured — signing key missing.",
      };
    }

    const secret = new TextEncoder().encode(key);
    const jwt = await new SignJWT({ role: "authorized" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(JWT_EXPIRATION)
      .sign(secret);

    await clearAttempts(rateLimitKey);

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return { success: true };
  }

  await recordFailedAttempt(rateLimitKey);
  const remaining = await getRemainingAttempts(rateLimitKey);

  return {
    success: false,
    error:
      remaining > 0
        ? `Invalid PIN. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
        : "Too many failed attempts. Please try again in 15 minutes.",
  };
}
