import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, fullName = '', organization = '', requestedIndexAccess = 'General' } = await request.json();
    const emailNormalized = String(email || '').trim().toLowerCase();
    
    // Check if DATABASE_URL is configured in production
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required in production');
    }

    // Skip database operations during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping database operations during build phase for user registration');
      return NextResponse.json({
        success: true,
        user: {
          id: 'build-phase-user',
          email: emailNormalized,
          fullName: String(fullName || '').trim(),
          organization: String(organization || '').trim(),
          status: 'PENDING'
        },
        users: []
      });
    }

    if (!emailNormalized) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized }
    });

    if (existingUser && existingUser.email.toLowerCase() === 'admin@genera.com') {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    if (existingUser) {
      // Update existing non-admin user to pending status
      const updatedUser = await prisma.user.update({
        where: { email: emailNormalized },
        data: {
          fullName: String(fullName || '').trim(),
          organization: String(organization || '').trim(),
          status: 'PENDING',
          role: 'USER',
          isActive: true,
          passwordHash: null,
          approvedBy: null,
          approvedAt: null,
          rejectedBy: null,
          rejectedAt: null,
          blockedBy: null,
          blockedAt: null,
          unblockedBy: null,
          unblockedAt: null,
          deletedBy: null,
          deletedAt: null,
          requestedIndexAccess: String(requestedIndexAccess || 'General').trim()
        }
      });

      return NextResponse.json({ success: true, user: updatedUser, users: [updatedUser] });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id: `user-${Date.now()}`,
        email: emailNormalized,
        fullName: String(fullName || '').trim(),
        organization: String(organization || '').trim(),
        position: '',
        status: 'PENDING',
        role: 'USER',
        passwordHash: null,
        isActive: true,
        requestedIndexAccess: String(requestedIndexAccess || 'General').trim()
      }
    });

    return NextResponse.json({ success: true, user: newUser, users: [newUser] });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}