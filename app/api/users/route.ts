import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET, generateSecurePassword } from '@/lib/auth';

// Force dynamic rendering - CRITICAL: Must be 'force-dynamic' for JWT verification
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

  // Get users from database
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return new Response(JSON.stringify({
    success: true,
    users: users
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(request: NextRequest) {
  console.log('🔍 === USER APPROVAL REQUEST START ===');
  
  try {
    // Proper JWT verification using jsonwebtoken library
    try {
      // Extract token from Authorization header, x-auth-token header, or auth-token cookie (fallbacks)
      const authHeader = request.headers.get('authorization');
      const xAuthHeader = request.headers.get('x-auth-token');
      const cookieToken = request.cookies.get('auth-token')?.value || null;
      console.log('1️⃣ Authorization header exists:', !!authHeader);
      console.log('1️⃣ x-auth-token header exists:', !!xAuthHeader);

      let token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.replace('Bearer ', '')
        : (xAuthHeader || cookieToken || null);

      if (!token) {
        console.log('❌ Missing or invalid header format');
        return NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        );
      }
      console.log('2️⃣ Token extracted, length:', token.length);
      console.log('   First 20 chars:', token.substring(0, 20) + '...');

      // Verify token using jwt.verify (this handles ALL decoding and validation)
      console.log('3️⃣ JWT_SECRET exists:', !!JWT_SECRET);
      console.log('   Attempting verification...');
      
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        isAdmin: boolean;
        iat: number;
        exp: number;
      };

      console.log('✅ Token verified successfully!');
      console.log('   User ID:', decoded.userId);
      console.log('   Email:', decoded.email);
      console.log('   Is Admin:', decoded.isAdmin);
      console.log('   Expires:', new Date(decoded.exp * 1000).toISOString());

      // Check if user is admin
      if (!decoded.isAdmin) {
        console.log('❌ User is not admin');
        return NextResponse.json(
          { error: 'Admin privileges required' },
          { status: 403 }
        );
      }

      console.log('4️⃣ Admin check passed, proceeding with approval...');

    } catch (err: unknown) {
      console.log('❌ === ERROR OCCURRED ===');
      const errorName = err instanceof Error ? err.name : 'UnknownError';
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.log('Error type:', errorName);
      console.log('Error message:', errorMessage);

      if (err instanceof jwt.TokenExpiredError) {
        console.error('JWT token expired');
        console.log('Token expired at:', err.expiredAt);
        return NextResponse.json(
          { error: 'Token expired' },
          { status: 401 }
        );
      } else if (err instanceof jwt.JsonWebTokenError) {
        console.error('JWT verification failed:', errorMessage);
        console.log('JWT Error Details:', err);
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
      console.error('Unexpected JWT error:', err);
      throw err; // Re-throw other errors
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

      // Check if user already exists
      const exists = await prisma.user.findUnique({
        where: { email }
      });

      if (exists) {
        return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 400 });
      }

      // Create new user
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
        // Generate secure password and hash it
        const plainPassword = generateSecurePassword(12);
        const passwordHash = await bcrypt.hash(plainPassword, 12);
        
        // Use transaction to ensure both user update and password creation succeed
        const result = await prisma.$transaction(async (tx) => {
          // Update user status and store password hash
          const updatedUser = await tx.user.update({
            where: { id: userId as string },
            data: {
              status: 'APPROVED',
              isActive: true,
              passwordHash: passwordHash,
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

          // Store plain password for admin reference
          await tx.password.upsert({
            where: { email: user.email },
            update: {
              plainPassword: plainPassword,
              generatedAt: currentTimestamp,
              approvedAt: currentTimestamp,
              approvedBy: actor,
              revokedAt: null,
              revokedBy: null,
            },
            create: {
              id: `pwd-${Date.now()}`,
              email: user.email,
              plainPassword: plainPassword,
              generatedAt: currentTimestamp,
              approvedAt: currentTimestamp,
              approvedBy: actor,
            }
          });

          return updatedUser;
        });
        
        updatedUser = result;
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

    return NextResponse.json({ success: true, users: allUsers, debug: { beforeUser: user, afterUser: updatedUser } });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}