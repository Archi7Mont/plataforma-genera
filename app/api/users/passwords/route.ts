import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.headers.get('x-auth-token');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Simple JWT verification
    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(atob(parts[1]));
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    if (!payload.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Skip database operations during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping database operations during build phase for passwords listing');
      return NextResponse.json({
        success: true,
        passwords: [{
          email: 'admin@genera.com',
          status: 'active',
          password: 'mock-password',
          plainPassword: 'mock-password',
          generatedAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: 'system',
          revokedAt: null,
          revokedBy: null
        }]
      });
    }

    // Check if DATABASE_URL is configured in production
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required in production');
    }

    const passwords = await prisma.password.findMany({
      orderBy: { generatedAt: 'desc' }
    });

    // Convert to PasswordState format for frontend
    const passwordStates = passwords.map(p => ({
      email: p.email,
      status: p.approvedAt ? 'active' : 'pending_approval',
      password: p.plainPassword,
      plainPassword: p.plainPassword,
      generatedAt: p.generatedAt.toISOString(),
      approvedAt: p.approvedAt?.toISOString() || null,
      approvedBy: p.approvedBy,
      revokedAt: p.revokedAt?.toISOString() || null,
      revokedBy: p.revokedBy
    }));

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

    // Simple JWT verification
    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(atob(parts[1]));
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    if (!payload.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email } = await request.json();
    const emailNormalized = String(email || '').trim().toLowerCase();
    if (!emailNormalized) return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });

    // Skip database operations during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping database operations during build phase for password deletion');
      return NextResponse.json({ success: true, passwords: [] });
    }

    // Check if DATABASE_URL is configured in production
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required in production');
    }

    // Delete password record
    await prisma.password.delete({
      where: { email: emailNormalized }
    });

    // Get updated list
    const updatedPasswords = await prisma.password.findMany({
      orderBy: { generatedAt: 'desc' }
    });

    return NextResponse.json({ success: true, passwords: updatedPasswords });
  } catch (error) {
    console.error('Error deleting password:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete entry' }, { status: 500 });
  }
}


