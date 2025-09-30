import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-static';

interface User {
  id: string;
  email: string;
  fullName: string;
  organization: string;
  position: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'DELETED';
  role: 'ADMIN' | 'USER';
  passwordHash: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  loginCount: number;
  isActive: boolean;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  blockedBy: string | null;
  blockedAt: Date | null;
  unblockedBy: string | null;
  unblockedAt: Date | null;
  deletedBy: string | null;
  deletedAt: Date | null;
  requestedIndexAccess: string | null;
}

export async function GET() {
  // During build time, return static response to prevent database access
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return new Response(JSON.stringify({
      success: true,
      users: [{
        id: 'build-phase-user',
        email: 'admin@genera.com',
        fullName: 'Administrator',
        organization: 'Géner.A System',
        position: 'System Administrator',
        status: 'APPROVED',
        role: 'ADMIN',
        isActive: true,
        loginCount: 0,
        createdAt: new Date().toISOString(),
        approvedBy: 'system',
        approvedAt: new Date().toISOString()
      }]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // If DATABASE_URL is not configured in production, return demo data
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    console.log('DATABASE_URL not configured, returning demo users data');
    return new Response(JSON.stringify({
      success: true,
      users: [
        {
          id: 'demo-admin',
          email: 'admin@genera.com',
          fullName: 'Administrator',
          organization: 'Géner.A System',
          position: 'System Administrator',
          status: 'APPROVED',
          role: 'ADMIN',
          isActive: true,
          loginCount: 0,
          createdAt: new Date().toISOString(),
          approvedBy: 'system',
          approvedAt: new Date().toISOString()
        }
        // In a real implementation, you would store demo users in memory or localStorage
        // For now, we'll return just the admin user
      ]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    success: false,
    error: 'Users endpoint - configure DATABASE_URL first'
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.headers.get('x-auth-token');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Simple JWT verification
    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(atob(parts[1]));
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const tokenTimestamp = Math.floor(Date.now() / 1000);
    if (payload.exp < tokenTimestamp) {
      return NextResponse.json({ success: false, error: 'Token expired' }, { status: 401 });
    }

    if (!payload.isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      action,
      userId,
      email,
      currentUserEmail,
      approvedBy,
      rejectedBy,
      blockedBy,
      unblockedBy,
      deletedBy
    } = body as {
      action: 'approve' | 'reject' | 'block' | 'unblock' | 'delete' | 'add';
      userId?: string;
      email?: string;
      currentUserEmail?: string;
      approvedBy?: string;
      rejectedBy?: string;
      blockedBy?: string;
      unblockedBy?: string;
      deletedBy?: string;
    };

    const currentTimestamp = new Date();

    if (action === 'add') {
      if (!email) {
        return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
      }

      const exists = await prisma.user.findUnique({
        where: { email }
      });

      if (exists) {
        return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 400 });
      }

      const newUser = await prisma.user.create({
        data: {
          id: `user-${Date.now()}`,
          email,
          fullName: '',
          organization: '',
          position: '',
          status: 'PENDING',
          role: 'USER',
          passwordHash: null,
          isActive: true,
        }
      });

      return NextResponse.json({ success: true, users: [newUser] });
    }

    // For actions that require an existing user
    const user = await prisma.user.findUnique({
      where: { id: userId as string }
    });

    if (!user) {
      console.log('User not found. UserId received:', userId, 'Type:', typeof userId);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const actor = currentUserEmail || approvedBy || rejectedBy || blockedBy || unblockedBy || deletedBy || 'admin';

    let updatedUser;
    switch (action) {
      case 'approve':
        updatedUser = await prisma.user.update({
          where: { id: userId as string },
          data: {
            status: 'APPROVED',
            isActive: true,
            approvedBy: actor,
            approvedAt: currentTimestamp,
            rejectedBy: null,
            rejectedAt: null,
            blockedBy: null,
            blockedAt: null,
            unblockedBy: null,
            unblockedAt: null,
            deletedBy: null,
            deletedAt: null,
          }
        });
        break;
      case 'reject':
        updatedUser = await prisma.user.update({
          where: { id: userId as string },
          data: {
            status: 'REJECTED',
            isActive: false,
            rejectedBy: actor,
            rejectedAt: currentTimestamp,
            blockedBy: null,
            blockedAt: null,
            unblockedBy: null,
            unblockedAt: null,
            deletedBy: null,
            deletedAt: null,
          }
        });
        break;
      case 'block':
        updatedUser = await prisma.user.update({
          where: { id: userId as string },
          data: {
            status: 'BLOCKED',
            isActive: false,
            blockedBy: actor,
            blockedAt: currentTimestamp,
            unblockedBy: null,
            unblockedAt: null,
            deletedBy: null,
            deletedAt: null,
          }
        });
        break;
      case 'unblock':
        updatedUser = await prisma.user.update({
          where: { id: userId as string },
          data: {
            status: 'APPROVED',
            isActive: true,
            unblockedBy: actor,
            unblockedAt: currentTimestamp,
            blockedBy: null,
            blockedAt: null,
            deletedBy: null,
            deletedAt: null,
          }
        });
        break;
      case 'delete':
        updatedUser = await prisma.user.update({
          where: { id: userId as string },
          data: {
            status: 'DELETED',
            isActive: false,
            deletedBy: actor,
            deletedAt: currentTimestamp,
          }
        });
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log('User update verification:', {
      userId,
      action,
      userFound: !!updatedUser,
      userStatus: updatedUser?.status,
      totalUsers: allUsers.length
    });

    return NextResponse.json({ success: true, users: allUsers });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}