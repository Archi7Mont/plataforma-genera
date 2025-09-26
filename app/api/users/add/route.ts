import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, fullName = '', organization = '' } = await request.json();
    const emailNormalized = String(email || '').trim().toLowerCase();
    
    if (!emailNormalized) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    let users = await store.getJson<any[]>('users', []);
    
    // Check if user already exists
    const existingUser = users.find((user: any) => (user.email || '').toLowerCase() === emailNormalized);
    if (existingUser) {
      // Always accept re-registration for any non-admin user: reset to pending
      if ((existingUser.email || '').toLowerCase() !== 'admin@genera.com') {
        existingUser.email = emailNormalized;
        existingUser.fullName = String(fullName || '').trim();
        existingUser.organization = String(organization || '').trim();
        existingUser.status = 'pending';
        existingUser.role = 'user';
        existingUser.isActive = true;
        existingUser.passwordHash = null;
        existingUser.approvedBy = null;
        existingUser.approvedAt = null;
        existingUser.rejectedBy = null;
        existingUser.rejectedAt = null;
        existingUser.blockedBy = null;
        existingUser.blockedAt = null;
        await store.setJson('users', users);
        return NextResponse.json({ success: true, user: existingUser, users });
      }
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email: emailNormalized,
      fullName: String(fullName || '').trim(),
      organization: String(organization || '').trim(),
      position: '',
      status: 'pending',
      role: 'user',
      passwordHash: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      loginCount: 0,
      isActive: true,
      approvedBy: null,
      approvedAt: null
    };
    
    users.push(newUser);
    await store.setJson('users', users);
    
    return NextResponse.json({ success: true, user: newUser, users });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}