"use server";

/**
 * Simple in-memory PIN rate limiter.
 * Tracks failed attempts per IP-like key and blocks after MAX_ATTEMPTS
 * within the WINDOW_MS time frame.
 *
 * Note: In a multi-instance deployment (e.g., serverless), consider
 * using an external store like Upstash Redis instead.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord {
    count: number;
    firstAttempt: number;
}

const attempts = new Map<string, AttemptRecord>();

/**
 * Check if a key is rate-limited. Returns true if blocked.
 */
export async function isRateLimited(key: string): Promise<boolean> {
    const now = Date.now();
    const record = attempts.get(key);

    if (!record) return false;

    // Window expired — reset
    if (now - record.firstAttempt > WINDOW_MS) {
        attempts.delete(key);
        return false;
    }

    return record.count >= MAX_ATTEMPTS;
}

/**
 * Record a failed attempt for the given key.
 */
export async function recordFailedAttempt(key: string): Promise<void> {
    const now = Date.now();
    const record = attempts.get(key);

    if (!record || now - record.firstAttempt > WINDOW_MS) {
        attempts.set(key, { count: 1, firstAttempt: now });
    } else {
        record.count += 1;
    }
}

/**
 * Clear attempts for a key on successful auth.
 */
export async function clearAttempts(key: string): Promise<void> {
    attempts.delete(key);
}

/**
 * Get remaining attempts for a key.
 */
export async function getRemainingAttempts(key: string): Promise<number> {
    const now = Date.now();
    const record = attempts.get(key);

    if (!record || now - record.firstAttempt > WINDOW_MS) return MAX_ATTEMPTS;

    return Math.max(0, MAX_ATTEMPTS - record.count);
}
