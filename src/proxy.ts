import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function proxy(request: NextRequest) {
    const token = request.cookies.get('foc_auth_token')?.value

    if (!token) {
        const response = NextResponse.next()
        response.headers.set('x-middleware-auth', 'failed')
        return response
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || process.env.GOOGLE_PRIVATE_KEY)
        if (!secret.length) throw new Error('Missing signing secret')

        await jwtVerify(token, secret)

        const response = NextResponse.next()
        response.headers.set('x-middleware-auth', 'success')
        return response

    } catch (e) {
        // Token is invalid/expired
        const response = NextResponse.next()
        response.headers.set('x-middleware-auth', 'failed')
        response.cookies.delete('foc_auth_token')
        return response
    }
}

export const config = {
    matcher: ['/((?!_next|favicon\\.ico|api/health).*)'],
}
