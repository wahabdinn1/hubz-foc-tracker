// Security Utilities
// Enhanced security helpers for API routes and server actions

import { errorLogger } from './error-logger'

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
  metadata?: Record<string, unknown>
) {
  errorLogger.warn(`Security event: ${event}`, {
    event,
    identifier,
    timestamp: new Date().toISOString(),
    ...metadata,
  })
}
