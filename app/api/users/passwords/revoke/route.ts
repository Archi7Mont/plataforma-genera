import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    const { email, revokedBy } = await request.json()

    if (!email || !revokedBy) {
      return NextResponse.json({ error: 'Email and revokedBy are required' }, { status: 400 })
    }

    // Get current password states
    let passwords = await store.getJson<Array<{ email: string; plainPassword: string; generatedAt: string; approvedAt?: string; approvedBy?: string }>>('generated_passwords', [])

    // Find and revoke the password (remove approval metadata)
    const passwordIndex = passwords.findIndex(p => p.email === email)
    if (passwordIndex === -1) {
      return NextResponse.json({ error: 'Password not found' }, { status: 404 })
    }

    // Remove approval metadata but keep the password entry as "no_password" state
    delete passwords[passwordIndex].approvedAt
    delete passwords[passwordIndex].approvedBy

    // Save updated passwords
    await store.setJson('generated_passwords', passwords)

    return NextResponse.json({ success: true, message: 'Password revoked successfully' })
  } catch (error) {
    console.error('Error revoking password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
