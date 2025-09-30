import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// This route should never execute during build
export const dynamic = 'force-static'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Fallback admin credentials for when database is not available
const FALLBACK_ADMIN = {
  email: 'admin@genera.com',
  // Default password: admin123 (you should change this)
  passwordHash: '$2a$12$LQv3c1yqBwlFbRb.p6.7CeDzYa3zt2EiJrC2T1l9lKzK8QhP8l7e', // "admin123"
  isAdmin: true,
  id: 'fallback-admin-1'
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // During build time, return static response to prevent database access
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        success: true,
        user: {
          id: 'build-admin',
          email: 'admin@genera.com',
          isAdmin: true
        },
        token: 'build-token-placeholder'
      });
    }

    // Check if this is the fallback admin login
    if (email === FALLBACK_ADMIN.email) {
      const isValidPassword = await bcrypt.compare(password, FALLBACK_ADMIN.passwordHash);

      if (isValidPassword) {
        const token = jwt.sign(
          {
            userId: FALLBACK_ADMIN.id,
            email: FALLBACK_ADMIN.email,
            isAdmin: FALLBACK_ADMIN.isAdmin
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return NextResponse.json({
          success: true,
          user: {
            id: FALLBACK_ADMIN.id,
            email: FALLBACK_ADMIN.email,
            isAdmin: FALLBACK_ADMIN.isAdmin
          },
          token
        });
      }
    }

    // If DATABASE_URL is not configured, only allow fallback admin
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'Authentication endpoint - configure DATABASE_URL first'
      }, { status: 503 });
    }

    // Database authentication logic would go here when DATABASE_URL is available
    return NextResponse.json({
      success: false,
      error: 'Database authentication not implemented yet'
    }, { status: 501 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}