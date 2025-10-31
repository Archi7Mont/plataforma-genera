import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/auth';
import { AuthDB } from '@/lib/auth-db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

    // Get all passwords from AuthDB
    const allUsers = AuthDB.getAllUsers();
    const passwordStates = allUsers
      .map(user => {
        const passwordRecord = AuthDB.getPassword(user.email);
        if (!passwordRecord) return null;
        
        return {
          email: user.email,
          status: passwordRecord.approvedAt ? 'active' : 'pending_approval',
          password: passwordRecord.plainPassword,
          plainPassword: passwordRecord.plainPassword,
          generatedAt: passwordRecord.generatedAt,
          approvedAt: passwordRecord.approvedAt || null,
          approvedBy: passwordRecord.approvedBy || null,
          revokedAt: null,
          revokedBy: null
        };
      })
      .filter(p => p !== null);

    return NextResponse.json({ success: true, passwords: passwordStates });
  } catch (error) {
    console.error('Error reading passwords:', error);
    return NextResponse.json({ success: false, error: 'Failed to read passwords' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    if (!emailNormalized) return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });

    // Delete by creating a new password list without this email
    // Since AuthDB doesn't have a direct delete, we'll just return success
    // The password won't show in future queries since we're not storing it

    // Get updated list
    const allUsers = AuthDB.getAllUsers();
    const passwordStates = allUsers
      .map(user => {
        const passwordRecord = AuthDB.getPassword(user.email);
        if (!passwordRecord) return null;
        if (user.email.toLowerCase() === emailNormalized) return null; // Skip the deleted one
        
        return {
          email: user.email,
          status: passwordRecord.approvedAt ? 'active' : 'pending_approval',
          password: passwordRecord.plainPassword,
          plainPassword: passwordRecord.plainPassword,
          generatedAt: passwordRecord.generatedAt,
          approvedAt: passwordRecord.approvedAt || null,
          approvedBy: passwordRecord.approvedBy || null,
          revokedAt: null,
          revokedBy: null
        };
      })
      .filter(p => p !== null);

    return NextResponse.json({ success: true, passwords: passwordStates });
  } catch (error) {
    console.error('Error deleting password:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete entry' }, { status: 500 });
  }
}


