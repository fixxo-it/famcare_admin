import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { pin } = body

    const adminPin = process.env.ADMIN_PIN || '1234'

    if (pin === adminPin) {
        const cookieStore = await cookies()
        cookieStore.set('admin_token', 'famcare-admin-session', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        })
        return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
}
