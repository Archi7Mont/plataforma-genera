import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Skip database operations during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping database operations during build phase for password reset requests');
      return NextResponse.json({
        success: true,
        requests: []
      });
    }

    const requests = await prisma.passwordResetRequest.findMany({
      orderBy: { requestedAt: 'desc' }
    });

    return NextResponse.json({ success: true, requests })
  } catch (error) {
    console.error('Read reset requests error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Skip database operations during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping database operations during build phase for password reset request POST');
      return NextResponse.json({
        success: true,
        request: {
          id: 'build-phase-request',
          email: 'test@example.com',
          requestedAt: new Date().toISOString(),
          status: 'PENDING'
        }
      });
    }

    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const resetRequest = await prisma.passwordResetRequest.create({
      data: {
        id: `reset-${Date.now()}`,
        email,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, request: resetRequest })
  } catch (error) {
    console.error('Create reset request error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create request' }, { status: 500 })
  }
}


