import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization') || ''
    const xAuth = request.headers.get('x-auth-token') || ''
    const cookieToken = request.cookies.get('auth-token')?.value || ''

    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const token = bearer || xAuth || cookieToken

    if (!token) {
      return NextResponse.json({
        ok: false,
        reason: 'MISSING_TOKEN',
        headers: { hasAuth: !!auth, hasXAuth: !!xAuth },
        cookie: !!cookieToken,
        env: { hasJWT_SECRET: !!JWT_SECRET }
      }, { status: 401 })
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      return NextResponse.json({
        ok: true,
        decoded,
        env: { hasJWT_SECRET: !!JWT_SECRET }
      })
    } catch (err: any) {
      return NextResponse.json({
        ok: false,
        reason: 'VERIFY_FAILED',
        message: err?.message || String(err),
        tokenHeader: (() => { try { return JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString('utf8')) } catch { return null } })(),
        tokenPayload: (() => { try { return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8')) } catch { return null } })(),
        env: { hasJWT_SECRET: !!JWT_SECRET }
      }, { status: 401 })
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}














