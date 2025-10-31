import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET, generateSecurePassword } from '@/lib/auth';
import { AuthDB } from '@/lib/auth-db';

export const dynamic = 'force-dynamic';

// Helper to verify JWT from request
function verifyAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) return false;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.isAdmin === true;
  } catch {
    return false;
  }
}

// GET /api/users/manage - Get all users or password history
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'password-history') {
    // Get password generation history
    const history = AuthDB.getGeneratedPasswordHistory(10);
    return NextResponse.json({
      success: true,
      history: history
    });
  }

  // Default: Get all users
  const users = AuthDB.getAllUsers();
  return NextResponse.json({
    success: true,
    users: users,
    total: users.length
  });
}

// POST /api/users/manage - Approve user and generate password
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { action, userId, email } = await request.json();

    if (action === 'approve') {
      if (!userId) {
        return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
      }

      // Find user
      const user = AuthDB.findUserById(userId);
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      // Generate secure password
      const plainPassword = generateSecurePassword(12);
      const passwordHash = await bcrypt.hash(plainPassword, 12);

      // Update user with APPROVED status and password
      const updatedUser = AuthDB.updateUser(userId, {
        status: 'APPROVED',
        isActive: true,
        passwordHash: passwordHash,
        approvedBy: 'admin',
        approvedAt: new Date().toISOString(),
      });

      // Save plain password for admin reference
      AuthDB.savePassword(user.email, plainPassword, true);

      // Record password generation in history
      AuthDB.recordPasswordGeneration(user.email, plainPassword, 'admin');

      return NextResponse.json({
        success: true,
        user: updatedUser,
        password: plainPassword,  // Only return here so admin can see it
        message: 'User approved and password generated'
      });
    }

    if (action === 'reject') {
      if (!userId) {
        return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
      }

      const user = AuthDB.findUserById(userId);
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      const updatedUser = AuthDB.updateUser(userId, {
        status: 'REJECTED',
        isActive: false,
      });

      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: 'User rejected'
      });
    }

    if (action === 'block') {
      if (!userId) {
        return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
      }

      const user = AuthDB.findUserById(userId);
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      const updatedUser = AuthDB.updateUser(userId, {
        status: 'BLOCKED',
        isActive: false,
      });

      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: 'User blocked'
      });
    }

    if (action === 'unblock') {
      if (!userId) {
        return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
      }

      const user = AuthDB.findUserById(userId);
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      const updatedUser = AuthDB.updateUser(userId, {
        status: 'APPROVED',
        isActive: true,
      });

      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: 'User unblocked'
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('User management error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
