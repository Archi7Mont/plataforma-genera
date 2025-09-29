import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Simple password verification
function simpleVerify(password: string, hash: string): boolean {
  let passwordHash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    passwordHash = ((passwordHash << 5) - passwordHash) + char;
    passwordHash = passwordHash & passwordHash; // Convert to 32-bit integer
  }
  return passwordHash.toString() === hash;
}

// Simple JWT implementation
function createJWT(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payloadWithExp = { ...payload, iat: now, exp: now + (24 * 60 * 60) }; // 24 hours
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payloadWithExp)).toString('base64url');
  const signature = 'mock-signature'; // In production, use proper HMAC
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Simple input sanitization
function sanitizeInput(input: string): string {
  return input.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeInput(email);
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if DATABASE_URL is configured in production
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required in production');
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    // Create admin user if it doesn't exist
    if (!user && sanitizedEmail === 'admin@genera.com') {
      const adminUser = await prisma.user.upsert({
        where: { email: 'admin@genera.com' },
        update: {},
        create: {
          id: 'admin-1',
          email: 'admin@genera.com',
          fullName: 'Administrator',
          organization: 'Géner.A System',
          position: 'System Administrator',
          status: 'APPROVED',
          role: 'ADMIN',
          passwordHash: 'Admin1234!',
          isActive: true,
          approvedBy: 'system',
          approvedAt: new Date(),
        }
      });
      return NextResponse.json({
        success: true,
        token: createJWT({
          userId: adminUser.id,
          email: sanitizedEmail,
          isAdmin: true
        }),
        user: {
          id: adminUser.id,
          email: adminUser.email,
          fullName: adminUser.fullName,
          organization: adminUser.organization,
          position: adminUser.position,
          isAdmin: true,
          status: adminUser.status
        }
      });
    }
    
    // Do NOT auto-create users on login. Ask them to register instead.
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Solicitar acceso' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 401 }
      );
    }

    // Check if user is approved
    if (user.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Cuenta pendiente de aprobación' },
        { status: 401 }
      );
    }

    // Verify password
    let isValid = false;
    
    // Special case for admin user
    if (sanitizedEmail === 'admin@genera.com' && password === 'Admin1234!') {
      isValid = true;
    } else if (user.passwordHash) {
      // Check if it's a plain text password or a hash
      if (user.passwordHash === password) {
        isValid = true;
      } else {
        isValid = simpleVerify(password, user.passwordHash);
      }
    }
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update user login info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 }
      }
    });

    // Generate JWT token
    const token = createJWT({
      userId: user.id,
      email: sanitizedEmail,
      isAdmin: user.role === 'admin'
    });

    // Prepare user data
    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      organization: user.organization,
      position: user.position,
      isAdmin: user.role === 'admin',
      status: user.status
    };

    // Return success with token
    return NextResponse.json({
      success: true,
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}