import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { JWT_SECRET } from '@/lib/auth'
import { AuthDB } from '@/lib/auth-db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const emailNormalized = String(email || '').trim().toLowerCase()

    // Admin fallback via environment variables (works on serverless)
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@genera.com').toLowerCase()
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    let user: any = null
    let isFileSystemAvailable = true

    try {
      user = AuthDB.findUserByEmail(emailNormalized)
    } catch {
      isFileSystemAvailable = false
    }

    if (!user && emailNormalized === adminEmail && password === adminPassword) {
      const token = jwt.sign(
        { userId: 'admin-user-1', email: adminEmail, isAdmin: true },
        JWT_SECRET,
        { expiresIn: '24h' }
      )
      return NextResponse.json({
        success: true,
        user: { id: 'admin-user-1', email: adminEmail, isAdmin: true },
        token
      })
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    if (user.status !== 'APPROVED' || !user.isActive) {
      return NextResponse.json({ success: false, error: 'User not approved or inactive' }, { status: 403 })
    }

    if (!user.passwordHash) {
      return NextResponse.json({ success: false, error: 'No password set for user' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    if (isFileSystemAvailable) {
      try {
        AuthDB.updateUser(user.id, {
          lastLoginAt: new Date().toISOString(),
          loginCount: (user.loginCount || 0) + 1,
        })
      } catch {}
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.role === 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, isAdmin: user.role === 'ADMIN' },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}