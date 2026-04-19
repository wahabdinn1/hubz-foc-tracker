// Security Utilities
// Enhanced security helpers for API routes and server actions

import { errorLogger, logAPIError, logAuthEvent } from './error-logger'
import { clearRateLimitForIP, getRateLimitStats, isIPBlocked } from './rate-limit'

/**
 * SECURITY HEADERS
 * Add security headers to responses
 */
export function applySecurityHeaders(response: Response, isAuthRoute = false): Response {
  const headers = new Headers(response.headers)
  
  // Core security headers (already in next.config.ts but reinforce here)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  
  // CSP - stricter for auth routes
  if (isAuthRoute) {
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
    )
  }
  
  // Prevent caching of sensitive data
  if (isAuthRoute) {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * RATE LIMITING FOR SERVER ACTIONS
 * Check rate limit before executing server actions
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  options?: { maxAttempts?: number; windowMs?: number }
): Promise<{ allowed: boolean; remaining?: number; resetTime?: number }> {
  const key = `action-${action}-${identifier}`
  const maxAttempts = options?.maxAttempts || 10
  const windowMs = options?.windowMs || 60 * 1000 // 1 minute
  
  // Note: This is a simplified version - use full rate-limit.ts for production
  // For now, we'll just return allowed
  return { allowed: true }
}

/**
 * IP BLACKLIST CHECK
 */
export async function isIPBlacklisted(ip: string): Promise<boolean> {
  // TODO: Implement actual blacklist from database
  return false
}

/**
 * SUSPICIOUS ACTIVITY DETECTION
 */
export function detectSuspiciousPattern(
  history: Array<{ timestamp: number; action: string; ip?: string }>
): { suspicious: boolean; reason?: string } {
  if (history.length < 5) return { suspicious: false }
  
  const now = Date.now()
  const oneMinute = 60 * 1000
  const fiveMinutes = 5 * 60 * 1000
  
  // Too many requests in short time
  const recent = history.filter(h => now - h.timestamp < oneMinute)
  if (recent.length > 20) {
    return { suspicious: true, reason: 'request_spike' }
  }
  
  // Many different actions from same IP in short time
  const ipGroups = history.reduce((acc, h) => {
    if (h.ip) {
      acc[h.ip] = (acc[h.ip] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)
  
  for (const [ip, count] of Object.entries(ipGroups)) {
    if (count > 30) {
      return { suspicious: true, reason: 'ip_flooding' }
    }
  }
  
  return { suspicious: false }
}

/**
 * INPUT SANITIZATION HELPERS
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .slice(0, 1000) // Limit length
}

export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email).toLowerCase()
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(sanitized) ? sanitized : ''
}

export function sanitizeIMEI(imei: string): string {
  const sanitized = sanitizeString(imei)
  // Remove non-digit characters
  const digitsOnly = sanitized.replace(/\D/g, '')
  // Validate length (15 or 14 digits for IMEI)
  return (digitsOnly.length === 15 || digitsOnly.length === 14) ? digitsOnly : ''
}

/**
 * AUDIT LOGGING
 */
export function logSecurityEvent(
  event: 'rate_limit_exceeded' | 'blocked_ip' | 'suspicious_activity' | 'failed_auth',
  identifier: string,
  metadata?: Record<string, any>
) {
  errorLogger.warn(`Security event: ${event}`, {
    event,
    identifier,
    timestamp: new Date().toISOString(),
    ...metadata,
  })
}

/**
 * Get security statistics
 */
export function getSecurityStats(): {
  rateLimitStats: Record<string, { count: number; attemptsLeft: number }>
  blockedIPs: string[]
  recentSecurityEvents: Array<{ timestamp: string; event: string; identifier: string }>
} {
  return {
    rateLimitStats: getRateLimitStats(),
    blockedIPs: [], // TODO: Implement actual blocked IP tracking
    recentSecurityEvents: errorLogger.getRecentLogs(10).filter(l => 
      l.level === 'warn' && l.message?.includes('Security')
    ).map(l => ({
      timestamp: l.timestamp,
      event: l.message || 'unknown',
      identifier: l.metadata?.identifier || 'unknown',
    })),
  }
}