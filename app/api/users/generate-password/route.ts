import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Generate secure password
function generateSecurePassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Simple hash function
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
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.headers.get('x-auth-token');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify JWT using jsonwebtoken
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { isAdmin: boolean };
      if (!decoded.isAdmin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { email } = await request.json();
    const emailNormalized = String(email || '').trim().toLowerCase();
    console.log('Received email:', email, 'Normalized:', emailNormalized);

    if (!emailNormalized) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Skip database operations during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping database operations during build phase for password generation');
      return NextResponse.json({
        success: true,
        password: 'mock-generated-password',
        email: emailNormalized,
        debug: {
          usersCount: 1,
          passwordsCount: 1,
          userStillExists: true
        }
      });
    }

    // Check if DATABASE_URL is configured in production
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required in production');
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: emailNormalized }
    });

    if (!user) {
      console.log('User not found. Email:', emailNormalized);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Found user:', user.email, 'Status:', user.status);

    // Check if user is approved
    if (user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'User must be approved before generating password' }, { status: 400 });
    }

    // Generate secure password
    const password = generateSecurePassword();
    const passwordHash = simpleHash(password);

    // Update user with password hash using transaction
    await prisma.$transaction(async (tx) => {
      // Update user with password hash
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });

      // Record plain password for admin display
      await tx.password.upsert({
        where: { email: emailNormalized },
        update: {
          plainPassword: password,
          generatedAt: new Date(),
        },
        create: {
          id: `pwd-${Date.now()}`,
          email: emailNormalized,
          plainPassword: password,
          generatedAt: new Date(),
        }
      });
    });

    console.log('Password generated successfully for:', emailNormalized);

    // Verify data was saved
    const verifyUsers = await prisma.user.findMany();
    const verifyPasswords = await prisma.password.findMany();
    console.log('Verification - Users count after save:', verifyUsers.length);
    console.log('Verification - Passwords count after save:', verifyPasswords.length);

    // Ensure the user still exists after password generation
    const userStillExists = verifyUsers.find(u => u.email.toLowerCase() === emailNormalized);
    if (!userStillExists) {
      console.error('CRITICAL: User disappeared after password generation!');
      return NextResponse.json({
        success: false,
        error: 'User data inconsistency detected'
      }, { status: 500 });
    }

    // Return success with password
    return NextResponse.json({
      success: true,
      password: password,
      email: emailNormalized,
      debug: {
        usersCount: verifyUsers.length,
        passwordsCount: verifyPasswords.length,
        userStillExists: !!userStillExists
      }
    });

  } catch (error) {
    console.error('Error generating password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}