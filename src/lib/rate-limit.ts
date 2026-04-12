"use server";

import { headers } from "next/headers";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

interface AttemptRecord {
    count: number;
    firstAttempt: number;
}

const attempts = new Map<string, AttemptRecord>();

export async function getRateLimitKey(): Promise<string> {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    return `pin-${ip}`;
}

export async function isRateLimited(key: string): Promise<boolean> {
    const now = Date.now();
    const record = attempts.get(key);

    if (!record) return false;

    if (now - record.firstAttempt > WINDOW_MS) {
        attempts.delete(key);
        return false;
    }

    return record.count >= MAX_ATTEMPTS;
}

export async function recordFailedAttempt(key: string): Promise<void> {
    const now = Date.now();
    const record = attempts.get(key);

    if (!record || now - record.firstAttempt > WINDOW_MS) {
        attempts.set(key, { count: 1, firstAttempt: now });
    } else {
        record.count += 1;
    }
}

export async function clearAttempts(key: string): Promise<void> {
    attempts.delete(key);
}

export async function getRemainingAttempts(key: string): Promise<number> {
    const now = Date.now();
    const record = attempts.get(key);

    if (!record || now - record.firstAttempt > WINDOW_MS) return MAX_ATTEMPTS;

    return Math.max(0, MAX_ATTEMPTS - record.count);
}
