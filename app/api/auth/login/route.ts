import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from '@/lib/auth';
import { prisma } from '@/lib/db';

// This route should never execute during build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


// Fallback admin credentials for when database is not available
const FALLBACK_ADMIN = {
  email: 'admin@genera.com',
  // Default password: admin123 (you should change this)
  passwordHash: '$2b$12$5J5czcjGWix07Tn.FTfjTOFfGKE/W7efcSgKXyXjF2inCeT7Zm3KS', // "admin123"
  isAdmin: true,
  id: 'fallback-admin-1'
};

function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

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
      } else {
        return NextResponse.json({
          success: false,
          error: 'Invalid credentials'
        }, { status: 401 });
      }
    }

    // If DATABASE_URL is not configured in production, refuse non-fallback logins
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'Authentication endpoint - configure DATABASE_URL first'
      }, { status: 503 });
    }

    const emailNormalized = String(email || '').trim().toLowerCase();

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: emailNormalized }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.status !== 'APPROVED' || !user.isActive) {
      return NextResponse.json({ success: false, error: 'User not approved or inactive' }, { status: 403 });
    }

    let isValid = false;
    const storedHash = user.passwordHash || '';

    if (storedHash) {
      if (storedHash.startsWith('$2')) {
        // bcrypt
        isValid = await bcrypt.compare(password, storedHash);
      } else {
        // simpleHash or plain
        const candidateSimple = simpleHash(password);
        isValid = (candidateSimple === storedHash) || (password === storedHash);
      }
    } else {
      // Fallback: compare with stored plain password record (admin-only display table)
      const pwd = await prisma.password.findUnique({ where: { email: emailNormalized } });
      if (pwd && pwd.plainPassword) {
        isValid = pwd.plainPassword === password;
      }
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Update login metadata
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 }
        }
      });
    } catch (e) {
      // non-fatal
      console.warn('Login metadata update failed:', e);
    }

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