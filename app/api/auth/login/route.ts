import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from '@/lib/auth';
import { AuthDB } from '@/lib/auth-db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const emailNormalized = String(email || '').trim().toLowerCase();

    // Find user in database
    const user = AuthDB.findUserByEmail(emailNormalized);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Check user status and active state
    if (user.status !== 'APPROVED' || !user.isActive) {
      return NextResponse.json({ success: false, error: 'User not approved or inactive' }, { status: 403 });
    }

    // Check if password is set
    if (!user.passwordHash) {
      return NextResponse.json({ success: false, error: 'No password set for user' }, { status: 401 });
    }

    // Verify password using bcrypt
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Update login metadata
    AuthDB.updateUser(user.id, {
      lastLoginAt: new Date().toISOString(),
      loginCount: user.loginCount + 1,
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        isAdmin: user.role === 'ADMIN'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.role === 'ADMIN'
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}