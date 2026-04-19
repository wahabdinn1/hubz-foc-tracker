import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { errorLogger } from '@/lib/error-logger'
import { isRateLimited, recordFailedAttempt, getRemainingAttempts } from '@/lib/rate-limit'

const AUTH_COOKIE = 'foc_auth_token'

function getSigningSecret(): Uint8Array {
    const key = process.env.JWT_SECRET
    if (!key) {
        errorLogger.error('Missing JWT_SECRET environment variable')
        return new Uint8Array(0)
    }
    return new TextEncoder().encode(key)
}

function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }
    if (realIP) {
        return realIP.trim()
    }
    
    return 'unknown'
}

/**
 * Check rate limit for authentication attempts
 */
async function checkAuthRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = `pin-${ip}`
    const limited = await isRateLimited(key)
    const remaining = await getRemainingAttempts(key)
    
    return { allowed: !limited, remaining }
}

/**
 * Record failed authentication attempt
 */
async function recordAuthFailure(ip: string): Promise<void> {
    const key = `pin-${ip}`
    await recordFailedAttempt(key)
    errorLogger.warn('Failed authentication attempt', { ip, key })
}

export async function proxy(request: NextRequest) {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    const ip = getClientIP(request)
    const pathname = request.nextUrl.pathname

    // Skip rate limiting for static assets and health checks
    const skippedPaths = [
      '/_next',
      '/api/health',
      '/favicon.ico',
    ]
    const isStaticAsset = /\.(jpg|jpeg|png|gif|ico|svg|css|js|woff|woff2|ttf|eot)$/i.test(pathname)
    
    if (skippedPaths.some(p => pathname.startsWith(p)) || isStaticAsset) {
        return NextResponse.next()
    }

    // Rate limit authentication endpoints
    const isAuthEndpoint = request.method === 'POST' && 
      (pathname.includes('/login') || pathname.includes('/api/auth'))
    
    if (isAuthEndpoint) {
        const { allowed, remaining } = await checkAuthRateLimit(ip)
        
        if (!allowed) {
            errorLogger.warn('Authentication rate limit exceeded', { ip })
            
            const response = NextResponse.json(
                { 
                    error: 'Too many failed attempts. Please try again in 15 minutes.' },
                { status: 429 }
            )
            response.headers.set('Retry-After', '900')
            response.headers.set('X-RateLimit-Limit', '5')
            response.headers.set('X-RateLimit-Remaining', '0')
            response.headers.set('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 900)
            return response
        }

        // Add rate limit headers to response
        const response = NextResponse.next()
        response.headers.set('X-RateLimit-Limit', '5')
        response.headers.set('X-RateLimit-Remaining', remaining.toString())
        response.headers.set('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 900)
        
        return response
    }

    // For authenticated requests, verify JWT token
    if (!token) {
        const response = NextResponse.next()
        response.headers.set('x-middleware-auth', 'failed')
        return response
    }

    try {
        const secret = getSigningSecret()
        if (!secret.length) {
            throw new Error('Missing JWT signing secret')
        }

        const { payload } = await jwtVerify(token, secret)
        
        // Log successful authentication
        errorLogger.debug('Request authenticated', { 
          userId: payload.sub, 
          pathname 
        })

        const response = NextResponse.next()
        response.headers.set('x-middleware-auth', 'success')
        return response

    } catch (error) {
        // Record failed attempt for rate limiting
        await recordAuthFailure(ip)
        
        // Log security event
        errorLogger.error('JWT verification failed', error instanceof Error ? error : new Error(String(error)), {
          pathname,
          ip,
        })

        const response = NextResponse.next()
        response.headers.set('x-middleware-auth', 'failed')
        response.cookies.delete(AUTH_COOKIE)
        return response
    }
}

export const config = {
    matcher: ['/((?!_next|favicon\\.ico|api/health|.*\\..*$).*)'],
}
