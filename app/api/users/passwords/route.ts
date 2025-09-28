import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

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

    const list = await store.getJson<Array<{ email: string; plainPassword: string; generatedAt: string; approvedAt?: string; approvedBy?: string }>>('generated_passwords', []);

    // Convert to PasswordState format for frontend
    const passwordStates = list.map(p => ({
      email: p.email,
      status: p.approvedAt ? 'active' : 'pending_approval',
      password: p.plainPassword,
      plainPassword: p.plainPassword,
      generatedAt: p.generatedAt,
      approvedAt: p.approvedAt,
      approvedBy: p.approvedBy,
      revokedAt: null,
      revokedBy: null
    }));

    return NextResponse.json({ success: true, passwords: passwordStates });
  } catch (error) {
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
    const current = await store.getJson<Array<{ email: string; plainPassword: string; generatedAt: string }>>('generated_passwords', []);
    const list = current.filter(p => (p.email || '').toLowerCase() !== emailNormalized);
    await store.setJson('generated_passwords', list);
    return NextResponse.json({ success: true, passwords: list });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete entry' }, { status: 500 });
  }
}


