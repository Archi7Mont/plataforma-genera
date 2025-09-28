import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface User {
  id: string;
  email: string;
  fullName: string;
  organization: string;
  position: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked' | 'deleted';
  role: 'admin' | 'user';
  passwordHash: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  loginCount: number;
  isActive: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  blockedBy?: string | null;
  blockedAt?: string | null;
  unblockedBy?: string | null;
  unblockedAt?: string | null;
  deletedBy?: string | null;
  deletedAt?: string | null;
}

export async function GET() {
  try {
    const users = await store.getJson<User[]>('users', []);
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error reading users:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.headers.get('x-auth-token');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Simple JWT verification
    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(atob(parts[1]));
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const tokenTimestamp = Math.floor(Date.now() / 1000);
    if (payload.exp < tokenTimestamp) {
      return NextResponse.json({ success: false, error: 'Token expired' }, { status: 401 });
    }

    if (!payload.isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      action,
      userId,
      email,
      currentUserEmail,
      approvedBy,
      rejectedBy,
      blockedBy,
      unblockedBy,
      deletedBy
    } = body as {
      action: 'approve' | 'reject' | 'block' | 'unblock' | 'delete' | 'add';
      userId?: string;
      email?: string;
      currentUserEmail?: string;
      approvedBy?: string;
      rejectedBy?: string;
      blockedBy?: string;
      unblockedBy?: string;
      deletedBy?: string;
    };

    const users: User[] = await store.getJson<User[]>('users', []);

    const currentTimestamp = new Date().toISOString();

    if (action === 'add') {
      if (!email) {
        return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
      }
      const exists = users.find(u => u.email === email);
      if (exists) {
        return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 400 });
      }
      const newUser: User = {
        id: Date.now().toString(),
        email,
        fullName: '',
        organization: '',
        position: '',
        status: 'pending',
        role: 'user',
        passwordHash: null,
        createdAt: currentTimestamp,
        lastLoginAt: null,
        loginCount: 0,
        isActive: true,
        approvedBy: null,
        approvedAt: null,
      };
      users.push(newUser);
      await store.setJson('users', users);
      return NextResponse.json({ success: true, users });
    }

    // For actions that require an existing user
    console.log('Looking for user with ID:', userId);
    console.log('Available user IDs:', users.map(u => u.id));
    console.log('User ID types:', users.map(u => typeof u.id));

    const index = users.findIndex(u => u.id === (userId as string));
    if (index === -1) {
      console.log('User not found. UserId received:', userId, 'Type:', typeof userId);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const actor = currentUserEmail || approvedBy || rejectedBy || blockedBy || unblockedBy || deletedBy || 'admin';

    switch (action) {
      case 'approve':
        users[index].status = 'approved';
        users[index].isActive = true;
        users[index].approvedBy = actor;
        users[index].approvedAt = currentTimestamp;
        break;
      case 'reject':
        users[index].status = 'rejected';
        users[index].isActive = false;
        (users[index] as any).rejectedBy = actor;
        (users[index] as any).rejectedAt = currentTimestamp;
        break;
      case 'block':
        users[index].status = 'blocked';
        users[index].isActive = false;
        (users[index] as any).blockedBy = actor;
        (users[index] as any).blockedAt = currentTimestamp;
        break;
      case 'unblock':
        users[index].status = 'approved';
        users[index].isActive = true;
        (users[index] as any).unblockedBy = actor;
        (users[index] as any).unblockedAt = currentTimestamp;
        break;
      case 'delete':
        users[index].status = 'deleted';
        users[index].isActive = false;
        (users[index] as any).deletedBy = actor;
        (users[index] as any).deletedAt = currentTimestamp;
        await store.setJson('users', users);
        return NextResponse.json({ success: true, users });
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    await store.setJson('users', users);
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}