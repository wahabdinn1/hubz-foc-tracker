import { headers } from "next/headers";
import { errorLogger } from "./error-logger";

// Configuration
const CONFIG = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  clearIntervalMs: 60 * 1000, // Clean up every minute
} as const;

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

const STORE_KEY = Symbol.for("foc_rate_limit_store");

// Get or initialize the rate limit store with thread-safety
function getStore(): Map<string, AttemptRecord> {
  const g = globalThis as unknown as Record<symbol, Map<string, AttemptRecord> | undefined>;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = new Map<string, AttemptRecord>();
    // Set up periodic cleanup only in server environment
    if (typeof window === 'undefined' && !g[STORE_KEY].has('__cleanup_initialized__')) {
      g[STORE_KEY].set('__cleanup_initialized__', { count: 0, firstAttempt: Date.now(), lastAttempt: Date.now() });
      setInterval(purgeStale, CONFIG.clearIntervalMs);
    }
  }
  return g[STORE_KEY]!;
}

// Clean up expired records
function purgeStale(): void {
  try {
    const now = Date.now();
    const store = getStore();
    let cleaned = 0;

    for (const [key, record] of store.entries()) {
      // Skip cleanup marker
      if (key === '__cleanup_initialized__') continue
      
      if (now - record.firstAttempt > CONFIG.windowMs) {
        store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0 && process.env.NODE_ENV === 'development') {
      errorLogger.debug(`Rate limit cleanup: removed ${cleaned} expired entries`);
    }
  } catch (error) {
    errorLogger.error('Error in rate limit cleanup', error instanceof Error ? error : new Error(String(error)));
  }
}

// Generate a rate limit key from IP and optional prefix
export async function getRateLimitKey(prefix = "pin"): Promise<string> {
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const realIP = headersList.get("x-real-ip");
    const ip = forwarded?.split(",")[0]?.trim() || realIP?.trim() || "unknown";
    return `${prefix}-${ip}`;
  } catch (error) {
    errorLogger.warn("Failed to extract IP for rate limiting", { error });
    return `${prefix}-unknown`;
  }
}

// Check if a key is rate limited
export async function isRateLimited(key: string): Promise<boolean> {
  try {
    purgeStale();

    const record = getStore().get(key);
    if (!record) return false;

    const now = Date.now();
    
    // Check if window expired
    if (now - record.firstAttempt > CONFIG.windowMs) {
      getStore().delete(key);
      return false;
    }

    return record.count >= CONFIG.maxAttempts;
  } catch (error) {
    errorLogger.error('Error checking rate limit', error instanceof Error ? error : new Error(String(error)), { key });
    return false; // Fail open - don't block if there's an error
  }
}

// Record a failed attempt
export async function recordFailedAttempt(key: string): Promise<void> {
  try {
    purgeStale();

    const now = Date.now();
    const store = getStore();
    const record = store.get(key);

    if (!record || now - record.firstAttempt > CONFIG.windowMs) {
      // First attempt in new window
      store.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      
      errorLogger.debug("Rate limit: first failed attempt recorded", { key });
    } else {
      // Increment existing record
      record.count += 1;
      record.lastAttempt = now;
      
      // Log when approaching limit
      if (record.count >= CONFIG.maxAttempts) {
        errorLogger.warn("Rate limit exceeded", { key, count: record.count });
      } else if (record.count >= CONFIG.maxAttempts - 1) {
        errorLogger.warn("Rate limit warning: approaching max attempts", {
          key,
          count: record.count,
          max: CONFIG.maxAttempts,
        });
      }
    }
  } catch (error) {
    errorLogger.error('Error recording failed attempt', error instanceof Error ? error : new Error(String(error)), { key });
  }
}

// Clear attempts for a key (on successful auth)
export async function clearAttempts(key: string): Promise<void> {
  try {
    const deleted = getStore().delete(key);
    if (deleted && process.env.NODE_ENV === 'development') {
      errorLogger.debug("Rate limit cleared for key", { key });
    }
  } catch (error) {
    errorLogger.error('Error clearing rate limit', error instanceof Error ? error : new Error(String(error)), { key });
  }
}

// Get remaining attempts for a key
export async function getRemainingAttempts(key: string): Promise<number> {
  try {
    const now = Date.now();
    const record = getStore().get(key);

    if (!record || now - record.firstAttempt > CONFIG.windowMs) return CONFIG.maxAttempts;

    return Math.max(0, CONFIG.maxAttempts - record.count);
  } catch (error) {
    errorLogger.error('Error getting remaining attempts', error instanceof Error ? error : new Error(String(error)), { key });
    return CONFIG.maxAttempts;
  }
}

// Get time until reset (in milliseconds)
export async function getTimeUntilReset(key: string): Promise<number> {
  try {
    const record = getStore().get(key);
    
    if (!record) return 0;

    const elapsed = Date.now() - record.firstAttempt;
    const remaining = Math.max(0, CONFIG.windowMs - elapsed);
    
    return remaining;
  } catch (error) {
    errorLogger.error('Error getting time until reset', error instanceof Error ? error : new Error(String(error)), { key });
    return 0;
  }
}

// Get all rate limit stats (for monitoring)
export function getRateLimitStats(): Record<string, { count: number; attemptsLeft: number; expiresIn: number }> {
  try {
    const now = Date.now();
    const stats: Record<string, { count: number; attemptsLeft: number; expiresIn: number }> = {};

    for (const [key, record] of getStore().entries()) {
      if (key === '__cleanup_initialized__') continue
      
      const elapsed = now - record.firstAttempt;
      const expiresIn = Math.max(0, CONFIG.windowMs - elapsed);
      const attemptsLeft = Math.max(0, CONFIG.maxAttempts - record.count);
      
      stats[key] = {
        count: record.count,
        attemptsLeft,
        expiresIn,
      };
    }

    return stats;
  } catch (error) {
    errorLogger.error('Error getting rate limit stats', error instanceof Error ? error : new Error(String(error)));
    return {};
  }
}

// Clear all rate limits (for admin use or testing)
export function clearAllRateLimits(): void {
  try {
    const store = getStore();
    const count = store.size - 1; // Subtract cleanup marker
    store.clear();
    // Re-add cleanup marker
    store.set('__cleanup_initialized__', { count: 0, firstAttempt: Date.now(), lastAttempt: Date.now() });
    errorLogger.info("All rate limits cleared", { count });
  } catch (error) {
    errorLogger.error('Error clearing all rate limits', error instanceof Error ? error : new Error(String(error)));
  }
}

// Check if IP should be blocked entirely (after multiple full limit cycles)
export async function isIPBlocked(ip: string): Promise<boolean> {
  try {
    const key = `pin-${ip}`;
    const record = getStore().get(key);
    
    if (!record) return false;
    
    const now = Date.now();
    const elapsed = now - record.firstAttempt;
    
    // If IP has hit limit multiple times within double the window, block it
    if (record.count >= CONFIG.maxAttempts * 3 && elapsed < CONFIG.windowMs * 2) {
      errorLogger.warn('IP temporarily blocked due to excessive failed attempts', { ip, count: record.count });
      return true;
    }
    
    return false;
  } catch (error) {
    errorLogger.error('Error checking IP block status', error instanceof Error ? error : new Error(String(error)), { ip });
    return false;
  }
}

const STORE_KEY = Symbol.for("foc_rate_limit_store");

// Get or initialize the rate limit store
function getStore(): Map<string, AttemptRecord> {
  const g = globalThis as unknown as Record<symbol, Map<string, AttemptRecord> | undefined>;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = new Map<string, AttemptRecord>();
    // Set up periodic cleanup
    if (typeof window === 'undefined') {
      setInterval(purgeStale, CONFIG.clearIntervalMs);
    }
  }
  return g[STORE_KEY]!;
}

// Clean up expired records
function purgeStale(): void {
  const now = Date.now();
  const store = getStore();
  let cleaned = 0;

  for (const [key, record] of store.entries()) {
    if (now - record.firstAttempt > CONFIG.windowMs) {
      store.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0 && process.env.NODE_ENV === 'development') {
    errorLogger.debug(`Rate limit cleanup: removed ${cleaned} expired entries`);
  }
}

// Generate a rate limit key from IP and optional prefix
export async function getRateLimitKey(prefix = "pin"): Promise<string> {
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const realIP = headersList.get("x-real-ip");
    const ip = forwarded?.split(",")[0]?.trim() || realIP?.trim() || "unknown";
    return `${prefix}-${ip}`;
  } catch (error) {
    errorLogger.warn("Failed to extract IP for rate limiting", { error });
    return `${prefix}-unknown`;
  }
}

// Check if a key is rate limited
export async function isRateLimited(key: string): Promise<boolean> {
  purgeStale();

  const record = getStore().get(key);
  if (!record) return false;

  const now = Date.now();
  
  // Check if window expired
  if (now - record.firstAttempt > CONFIG.windowMs) {
    getStore().delete(key);
    return false;
  }

  return record.count >= CONFIG.maxAttempts;
}

// Record a failed attempt
export async function recordFailedAttempt(key: string): Promise<void> {
  purgeStale();

  const now = Date.now();
  const store = getStore();
  const record = store.get(key);

  if (!record || now - record.firstAttempt > CONFIG.windowMs) {
    // First attempt in new window
    store.set(key, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    
    errorLogger.debug("Rate limit: first failed attempt recorded", { key });
  } else {
    // Increment existing record
    record.count += 1;
    record.lastAttempt = now;
    
    // Log when approaching limit
    if (record.count >= CONFIG.maxAttempts - 1) {
      errorLogger.warn("Rate limit warning: approaching max attempts", {
        key,
        count: record.count,
        max: CONFIG.maxAttempts,
      });
    }
  }
}

// Clear attempts for a key (on successful auth)
export async function clearAttempts(key: string): Promise<void> {
  const deleted = getStore().delete(key);
  if (deleted && process.env.NODE_ENV === 'development') {
    errorLogger.debug("Rate limit cleared for key", { key });
  }
}

// Get remaining attempts for a key
export async function getRemainingAttempts(key: string): Promise<number> {
  const now = Date.now();
  const record = getStore().get(key);

  if (!record || now - record.firstAttempt > CONFIG.windowMs) {
    return CONFIG.maxAttempts;
  }

  return Math.max(0, CONFIG.maxAttempts - record.count);
}

// Get time until reset (in milliseconds)
export async function getTimeUntilReset(key: string): Promise<number> {
  const record = getStore().get(key);
  
  if (!record) return 0;

  const elapsed = Date.now() - record.firstAttempt;
  const remaining = Math.max(0, CONFIG.windowMs - elapsed);
  
  return remaining;
}

// Get all rate limit stats (for monitoring)
export function getRateLimitStats(): Record<string, { count: number; attemptsLeft: number; expiresIn: number }> {
  const now = Date.now();
  const stats: Record<string, { count: number; attemptsLeft: number; expiresIn: number }> = {};

  for (const [key, record] of getStore().entries()) {
    const elapsed = now - record.firstAttempt;
    const expiresIn = Math.max(0, CONFIG.windowMs - elapsed);
    const attemptsLeft = Math.max(0, CONFIG.maxAttempts - record.count);
    
    stats[key] = {
      count: record.count,
      attemptsLeft,
      expiresIn,
    };
  }

  return stats;
}

// Clear all rate limits (for admin use or testing)
export function clearAllRateLimits(): void {
  const store = getStore();
  const count = store.size;
  store.clear();
  errorLogger.info("All rate limits cleared", { count });
}

// Check if IP should be blocked entirely (after multiple full limit cycles)
export async function isIPBlocked(ip: string): Promise<boolean> {
  const key = `pin-${ip}`;
  const record = getStore().get(key);
  
  if (!record) return false;
  
  const now = Date.now();
  const elapsed = now - record.firstAttempt;
  
  // If IP has hit limit multiple times within double the window, block it
  if (record.count >= CONFIG.maxAttempts * 3 && elapsed < CONFIG.windowMs * 2) {
    return true;
  }
  
  return false;
}
