import { headers } from "next/headers";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

interface AttemptRecord {
    count: number;
    firstAttempt: number;
}

const GLOBAL_KEY = Symbol.for("foc_rate_limit_attempts");

function getAttempts(): Map<string, AttemptRecord> {
    const g = globalThis as unknown as Record<symbol, Map<string, AttemptRecord> | undefined>;
    if (!g[GLOBAL_KEY]) {
        g[GLOBAL_KEY] = new Map<string, AttemptRecord>();
    }
    return g[GLOBAL_KEY]!;
}

function purgeStale(): void {
    const now = Date.now();
    const store = getAttempts();
    for (const [key, record] of store) {
        if (now - record.firstAttempt > WINDOW_MS) {
            store.delete(key);
        }
    }
}

export async function getRateLimitKey(prefix = "pin"): Promise<string> {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    return `${prefix}-${ip}`;
}

export async function isRateLimited(key: string): Promise<boolean> {
    purgeStale();

    const record = getAttempts().get(key);
    if (!record) return false;

    const now = Date.now();
    if (now - record.firstAttempt > WINDOW_MS) {
        getAttempts().delete(key);
        return false;
    }

    return record.count >= MAX_ATTEMPTS;
}

export async function recordFailedAttempt(key: string): Promise<void> {
    purgeStale();

    const now = Date.now();
    const store = getAttempts();
    const record = store.get(key);

    if (!record || now - record.firstAttempt > WINDOW_MS) {
        store.set(key, { count: 1, firstAttempt: now });
    } else {
        record.count += 1;
    }
}

export async function clearAttempts(key: string): Promise<void> {
    getAttempts().delete(key);
}

export async function getRemainingAttempts(key: string): Promise<number> {
    const now = Date.now();
    const record = getAttempts().get(key);

    if (!record || now - record.firstAttempt > WINDOW_MS) return MAX_ATTEMPTS;

    return Math.max(0, MAX_ATTEMPTS - record.count);
}
