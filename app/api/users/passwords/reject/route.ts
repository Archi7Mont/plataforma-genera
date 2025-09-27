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

    const { email, rejectedBy } = await request.json()

    if (!email || !rejectedBy) {
      return NextResponse.json({ error: 'Email and rejectedBy are required' }, { status: 400 })
    }

    // Get current password states
    let passwords = await store.getJson<Array<{ email: string; plainPassword: string; generatedAt: string; approvedAt?: string; approvedBy?: string }>>('generated_passwords', [])

    // Remove the password entry
    const initialLength = passwords.length
    passwords = passwords.filter(p => p.email !== email)

    if (passwords.length === initialLength) {
      return NextResponse.json({ error: 'Password not found' }, { status: 404 })
    }

    // Save updated passwords
    await store.setJson('generated_passwords', passwords)

    return NextResponse.json({ success: true, message: 'Password rejected successfully' })
  } catch (error) {
    console.error('Error rejecting password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
