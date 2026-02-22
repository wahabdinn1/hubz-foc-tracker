import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// This function can be marked `async` if using `await` inside
export async function proxy(request: NextRequest) {
    const token = request.cookies.get('foc_auth_token')?.value

    if (!token) {
        // We do not redirect to a separate login page right now because our PIN modal
        // operates on the root component itself.
        // But we add a custom header so the page knows it failed middleware auth quickly.
        const response = NextResponse.next()
        response.headers.set('x-middleware-auth', 'failed')
        return response
    }

    try {
        const secret = new TextEncoder().encode(process.env.GOOGLE_PRIVATE_KEY || "fallback_secret")
        await jwtVerify(token, secret)

        const response = NextResponse.next()
        response.headers.set('x-middleware-auth', 'success')
        return response

    } catch (e) {
        // Token is invalid/expired
        const response = NextResponse.next()
        response.headers.set('x-middleware-auth', 'failed')
        // We optionally clear the invalid cookie
        response.cookies.delete('foc_auth_token')
        return response
    }
}

// See "Matching Paths" below to learn more
export const config = {
    // We only want to run this middleware on the root page or generic app paths
    matcher: ['/', '/api/:path*'],
}
