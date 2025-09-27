import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await store.getJson<Array<{ email: string; plainPassword: string; generatedAt: string; approvedAt?: string; approvedBy?: string }>>('generated_passwords', []);

    // Convert to PasswordState format for frontend
    const passwordStates = list.map(p => ({
      email: p.email,
      status: p.approvedAt ? 'active' : 'pending_approval',
      password: p.plainPassword,
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


