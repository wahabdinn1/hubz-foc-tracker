// API Rate Limiting Middleware
// Rate limiting for API routes using Redis or in-memory storage

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Rate limit constants
const LIMITS = {
  // Per IP limits
  default: {
    maxRequests: 100, // per 15 minutes
    windowMs: 15 * 60 * 1000,
  },
  // Strict limits for login/auth endpoints
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },
  // Moderate limits for write operations
  mutation: {
    maxRequests: 30,
    windowMs: 15 * 60 * 1000,
  },
} as const

// Simple in-memory store (use Redis in production)
const requestStore = new Map<string, { count: number; resetTime: number }>()

function getIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP.trim()
  }
  
  return 'anonymous'
}

function getRouteCategory(pathname: string): keyof typeof LIMITS {
  if (pathname.includes('/login') || pathname.includes('/api/auth')) {
    return 'auth'
  }
  if (pathname.includes('/api/') && (pathname.includes('/request') || pathname.includes('/return') || pathname.includes('/transfer'))) {
    return 'mutation'
  }
  return 'default'
}

function clearExpiredEntries(): void {
  const now = Date.now()
  for (const [key, value] of requestStore.entries()) {
    if (now > value.resetTime) {
      requestStore.delete(key)
    }
  }
}

export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Skip rate limiting for static assets and development
  const pathname = request.nextUrl.pathname
  if (pathname.match(/\.(jpg|jpeg|png|gif|ico|svg|css|js|woff|woff2|ttf|eot)$/)) {
    return null
  }

  // Only rate limit API routes in development
  if (process.env.NODE_ENV === 'development' && !pathname.startsWith('/api/')) {
    return null
  }

  const ip = getIP(request)
  const category = getRouteCategory(pathname)
  const limit = LIMITS[category]
  const storeKey = `${category}-${ip}`

  // Clear expired entries periodically
  clearExpiredEntries()

  // Get or create rate limit record
  const now = Date.now()
  const record = requestStore.get(storeKey)

  if (!record || now > record.resetTime) {
    // First request or window expired
    requestStore.set(storeKey, {
      count: 1,
      resetTime: now + limit.windowMs,
    })
  } else {
    // Increment counter
    record.count++
    
    // Check if limit exceeded
    if (record.count > limit.maxRequests) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`,
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        },
        { status: 429 }
      )
      
      response.headers.set('X-RateLimit-Limit', limit.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', '0')
      response.headers.set('X-RateLimit-Reset', Math.floor(record.resetTime / 1000).toString())
      response.headers.set('Retry-After', Math.ceil((record.resetTime - now) / 1000).toString())
      
      return response
    }
  }

  // Add rate limit headers
  const response = NextResponse.next()
  const record = requestStore.get(storeKey)
  
  if (record) {
    response.headers.set('X-RateLimit-Limit', limit.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(0, limit.maxRequests - record.count).toString())
    response.headers.set('X-RateLimit-Reset', Math.floor(record.resetTime / 1000).toString())
  }
  
  return null // Continue to next handler
}

// Export utility functions for use in server actions
export function clearRateLimitForIP(ip: string, category?: keyof typeof LIMITS): void {
  if (category) {
    requestStore.delete(`${category}-${ip}`)
  } else {
    // Clear all categories for this IP
    for (const cat of Object.keys(LIMITS) as Array<keyof typeof LIMITS>) {
      requestStore.delete(`${cat}-${ip}`)
    }
  }
}

export function getRateLimitStats(): Record<string, { count: number; resetTime: number }> {
  const stats: Record<string, { count: number; resetTime: number }> = {}
  for (const [key, value] of requestStore.entries()) {
    stats[key] = value
  }
  return stats
}