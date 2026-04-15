"use server";

import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { AUTH_COOKIE_NAME, JWT_EXPIRATION, COOKIE_MAX_AGE } from "@/lib/constants";
import { timingSafeEqual } from "@/lib/crypto";
import { isRateLimited, recordFailedAttempt, clearAttempts, getRemainingAttempts, getRateLimitKey } from "@/lib/rate-limit";
import type { ActionResult } from "@/types/inventory";

export async function verifyPin(inputPin: string): Promise<ActionResult> {
  const rateLimitKey = await getRateLimitKey();

  if (await isRateLimited(rateLimitKey)) {
    return {
      success: false,
      error: "Too many failed attempts. Please try again in 15 minutes.",
    };
  }

  const authorizedPins = process.env.AUTHORIZED_PINS?.split(",") || [];

  const matchedPin = authorizedPins.find(pin => timingSafeEqual(pin.trim(), inputPin));

  if (matchedPin !== undefined) {
    const key = process.env.JWT_SECRET;
    if (!key) {
      return {
        success: false,
        error: "Server misconfigured — JWT_SECRET is not set.",
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
