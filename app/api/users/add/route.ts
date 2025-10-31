import { NextRequest, NextResponse } from 'next/server';
import { AuthDB } from '@/lib/auth-db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, fullName = '', organization = '', requestedIndexAccess = 'General' } = await request.json();
    const emailNormalized = String(email || '').trim().toLowerCase();
    
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

    // If DATABASE_URL is not configured in production, return success for demo purposes
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      console.log('DATABASE_URL not configured, returning demo success for registration');
      return NextResponse.json({
        success: true,
        user: {
          id: `demo-user-${Date.now()}`,
          email: emailNormalized,
          fullName: String(fullName || '').trim(),
          organization: String(organization || '').trim(),
          position: '',
          status: 'PENDING',
          role: 'USER',
          passwordHash: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: null,
          loginCount: 0,
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
        },
        users: []
      });
    }

    if (!emailNormalized) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Try database operations with fallback
    try {
      // Check if user already exists
      const existingUser = await AuthDB.findUserByEmail(emailNormalized);

      if (existingUser && existingUser.email.toLowerCase() === 'admin@genera.com') {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      if (existingUser) {
        // Update existing non-admin user to pending status
        const updatedUser = AuthDB.updateUser(existingUser.id, {
          fullName: String(fullName || '').trim(),
          organization: String(organization || '').trim(),
          status: 'PENDING',
          role: 'USER',
          isActive: true,
          passwordHash: undefined,
          approvedBy: undefined,
          approvedAt: undefined,
          requestedIndexAccess: String(requestedIndexAccess || 'General').trim()
        });

        return NextResponse.json({ success: true, user: updatedUser, users: [updatedUser] });
      }

      // Create new user
      const newUser = AuthDB.createUser({
        email: emailNormalized,
        fullName: String(fullName || '').trim(),
        organization: String(organization || '').trim(),
        position: '',
        status: 'PENDING',
        role: 'USER',
        isActive: true,
        loginCount: 0,
        requestedIndexAccess: String(requestedIndexAccess || 'General').trim()
      });

      return NextResponse.json({ success: true, user: newUser, users: [newUser] });
    } catch (dbError) {
      // If database operations fail, fall back to demo mode
      console.log('Database operations failed, using demo mode:', dbError);
      // Check if user already exists in demo storage
      const existingDemoUser = AuthDB.findUserByEmail(emailNormalized);
      if (existingDemoUser) {
        return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 400 });
      }

      // Create new demo user
      const demoUser = AuthDB.createUser({
        email: emailNormalized,
        fullName: String(fullName || '').trim(),
        organization: String(organization || '').trim(),
        position: '',
        status: 'PENDING',
        role: 'USER',
        isActive: true,
        loginCount: 0,
        requestedIndexAccess: String(requestedIndexAccess || 'General').trim()
      });

      return NextResponse.json({
        success: true,
        user: demoUser,
        users: [demoUser]
      });
    }
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}