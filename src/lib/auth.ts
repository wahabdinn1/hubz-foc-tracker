"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";

/**
 * Shared server-side authentication check.
 * Verifies the JWT token stored in the `foc_auth_token` cookie.
 * Call this in any Server Component that needs to gate access.
 */
export async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get("foc_auth_token")?.value;

    if (!token) return false;

    try {
        const secret = new TextEncoder().encode(
            process.env.GOOGLE_PRIVATE_KEY || "fallback_secret"
        );
        await jwtVerify(token, secret);
        return true;
    } catch {
        return false;
    }
}
