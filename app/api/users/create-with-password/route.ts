import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { JWT_SECRET, generateSecurePassword } from '@/lib/auth'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authHeader = request.headers.get('authorization') || ''
    const xAuthHeader = request.headers.get('x-auth-token') || ''
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    const token = bearer || xAuthHeader

    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { isAdmin?: boolean }
      if (!decoded?.isAdmin) {
        return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
      }
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    // Skip database operations during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping database operations during build phase for create-with-password');
      return NextResponse.json({
        success: true,
        user: {
          id: 'build-phase-user',
          email: 'test@example.com',
          fullName: 'Test User',
          organization: 'Test Org',
          position: 'Test Position',
          role: 'user',
          status: 'pending',
          createdAt: new Date().toISOString()
        },
        password: 'mock-password'
      });
    }

    const { email, fullName, organization, position, role = 'user', approved = true, password } = await request.json()

    if (!email || !fullName) {
      return NextResponse.json({
        error: 'Email and full name are required'
      }, { status: 400 })
    }

    // Check if DATABASE_URL is configured in production
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required in production');
    }

    const emailNormalized = String(email).trim().toLowerCase()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized }
    });

    if (existingUser) {
      return NextResponse.json({
        error: 'User already exists'
      }, { status: 400 })
    }

    // Use provided password or generate a secure one
    const finalPassword = String(password || generateSecurePassword(12))
    const passwordHash = await bcrypt.hash(finalPassword, 12)

    // Create new user with password
    const newUser = await prisma.user.create({
      data: {
        id: `user-${Date.now()}`,
        email: emailNormalized,
        fullName,
        organization: organization || '',
        position: position || '',
        status: approved ? 'APPROVED' : 'PENDING',
        role: (role || 'user').toUpperCase() as 'ADMIN' | 'USER',
        passwordHash,
        isActive: true,
      }
    });

    // Store password for admin reference
    await prisma.password.upsert({
      where: { email: emailNormalized },
      data: {
        id: `pwd-${Date.now()}`,
        email: emailNormalized,
        plainPassword: finalPassword,
        generatedAt: new Date(),
      },
      update: {
        plainPassword: finalPassword,
        generatedAt: new Date(),
        approvedAt: null,
        approvedBy: null,
        revokedAt: null,
        revokedBy: null,
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        organization: newUser.organization,
        position: newUser.position,
        role: newUser.role.toLowerCase(),
        status: newUser.status.toLowerCase(),
        createdAt: newUser.createdAt.toISOString()
      },
      password: finalPassword
    })
  } catch (error) {
    console.error('Error creating user with password:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
