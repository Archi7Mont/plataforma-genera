import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.headers.get('x-auth-token');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Simple JWT verification
    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(atob(parts[1]));
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    if (!payload.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if DATABASE_URL is configured in production
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required in production');
    }

    const { email, approvedBy } = await request.json()

    if (!email || !approvedBy) {
      return NextResponse.json({ error: 'Email and approvedBy are required' }, { status: 400 })
    }

    // Update password in database
    const updatedPassword = await prisma.password.update({
      where: { email },
      data: {
        approvedAt: new Date(),
        approvedBy
      }
    });

    return NextResponse.json({ success: true, message: 'Password approved successfully', password: updatedPassword })
  } catch (error) {
    console.error('Error approving password:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Password not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
