"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

/**
 * Returns the JWT signing secret.
 * Throws at call time if the environment variable is not configured.
 */
function getSigningSecret(): Uint8Array {
  const key = process.env.JWT_SECRET;
  if (!key) {
    throw new Error("[AUTH] JWT_SECRET must be set.");
  }
  return new TextEncoder().encode(key);
}

/**
 * Shared server-side authentication check.
 * Verifies the JWT token stored in the `foc_auth_token` cookie.
 * Call this in any Server Component or Server Action that needs to gate access.
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return false;

  try {
    await jwtVerify(token, getSigningSecret());
    return true;
  } catch {
    return false;
  }
}
