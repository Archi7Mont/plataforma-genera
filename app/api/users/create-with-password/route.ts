import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
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

    const { email, fullName, organization, position, role = 'user' } = await request.json()

    if (!email || !fullName) {
      return NextResponse.json({
        error: 'Email and full name are required'
      }, { status: 400 })
    }

    // Check if DATABASE_URL is configured in production
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required in production');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({
        error: 'User already exists'
      }, { status: 400 })
    }

    // Generate secure password
    const password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    const passwordHash = password; // In production, use proper hashing

    // Create new user with password
    const newUser = await prisma.user.create({
      data: {
        id: `user-${Date.now()}`,
        email: email.toLowerCase(),
        fullName,
        organization: organization || '',
        position: position || '',
        status: role === 'admin' ? 'APPROVED' : 'PENDING',
        role: role.toUpperCase() as 'ADMIN' | 'USER',
        passwordHash,
        isActive: true,
      }
    });

    // Store password for admin reference
    await prisma.password.create({
      data: {
        id: `pwd-${Date.now()}`,
        email: email.toLowerCase(),
        plainPassword: password,
        generatedAt: new Date(),
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
      password
    })
  } catch (error) {
    console.error('Error creating user with password:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
