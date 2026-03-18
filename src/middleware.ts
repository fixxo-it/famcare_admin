import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Allow static files, login page, and auth API
    if (
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico' ||
        pathname === '/login' ||
        pathname.startsWith('/auth') ||
        pathname === '/'
    ) {
        return NextResponse.next()
    }

    // Check for admin auth cookie
    const adminToken = request.cookies.get('admin_token')

    if (!adminToken) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
