import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET, generateSecurePassword } from '@/lib/auth';
import { AuthDB } from '@/lib/auth-db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Note: generateSecurePassword is now imported from @/lib/auth

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.headers.get('x-auth-token');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify JWT
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
    
    if (!emailNormalized) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user in AuthDB
    const user = AuthDB.findUserByEmail(emailNormalized);

    if (!user) {
      console.log('User not found. Email:', emailNormalized);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Found user:', user.email, 'Status:', user.status);

    // Check if user is approved
    if (user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'User must be approved before generating password' }, { status: 400 });
    }

    // Generate secure password and hash it with bcrypt
    const password = generateSecurePassword(12);
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user with password hash
    const updatedUser = AuthDB.updateUser(user.id, {
      passwordHash: passwordHash
    });

    // Save plain password for admin reference (auto-approved)
    AuthDB.savePassword(emailNormalized, password, true);

    console.log('Password generated successfully for:', emailNormalized);

    // Return success with password
    return NextResponse.json({
      success: true,
      password: password,
      email: emailNormalized,
      message: 'Password generated successfully'
    });

  } catch (error) {
    console.error('Error generating password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}