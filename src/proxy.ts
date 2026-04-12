import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const AUTH_COOKIE = 'foc_auth_token'

function getSigningSecret(): Uint8Array {
    const key = process.env.JWT_SECRET
    if (!key) return new Uint8Array(0)
    return new TextEncoder().encode(key)
}

export async function proxy(request: NextRequest) {
    const token = request.cookies.get(AUTH_COOKIE)?.value

    if (!token) {
        const response = NextResponse.next()
        response.headers.set('x-middleware-auth', 'failed')
        return response
    }

    try {
        const secret = getSigningSecret()
        if (!secret.length) throw new Error('Missing signing secret')

        await jwtVerify(token, secret)

        const response = NextResponse.next()
        response.headers.set('x-middleware-auth', 'success')
        return response

    } catch {
        const response = NextResponse.next()
        response.headers.set('x-middleware-auth', 'failed')
        response.cookies.delete(AUTH_COOKIE)
        return response
    }
}

export const config = {
    matcher: ['/((?!_next|favicon\\.ico|api/health).*)'],
}
