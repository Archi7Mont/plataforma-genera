import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
    const repoDataDir = path.join(process.cwd(), 'data');
    const runtimeDataDir = process.env.VERCEL ? path.join('/tmp', 'data') : repoDataDir;
    if (!fs.existsSync(runtimeDataDir)) fs.mkdirSync(runtimeDataDir, { recursive: true });
    const usersFile = path.join(runtimeDataDir, 'users.json');
    if (!fs.existsSync(usersFile)) {
      const seedFile = path.join(repoDataDir, 'users.json');
      if (fs.existsSync(seedFile)) fs.copyFileSync(seedFile, usersFile); else fs.writeFileSync(usersFile, '[]');
    }
    const users: User[] = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error reading users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const repoDataDir = path.join(process.cwd(), 'data');
    const runtimeDataDir = process.env.VERCEL ? path.join('/tmp', 'data') : repoDataDir;
    if (!fs.existsSync(runtimeDataDir)) fs.mkdirSync(runtimeDataDir, { recursive: true });
    const usersFile = path.join(runtimeDataDir, 'users.json');
    const users: User[] = fs.existsSync(usersFile)
      ? JSON.parse(fs.readFileSync(usersFile, 'utf8'))
      : [];

    const now = new Date().toISOString();

    if (action === 'add') {
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }
      const exists = users.find(u => u.email === email);
      if (exists) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
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
        createdAt: now,
        lastLoginAt: null,
        loginCount: 0,
        isActive: true,
        approvedBy: null,
        approvedAt: null,
      };
      users.push(newUser);
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
      return NextResponse.json({ success: true, users });
    }

    // For actions that require an existing user
    const index = users.findIndex(u => u.id === (userId as string));
    if (index === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const actor = currentUserEmail || approvedBy || rejectedBy || blockedBy || unblockedBy || deletedBy || 'admin';

    switch (action) {
      case 'approve':
        users[index].status = 'approved';
        users[index].isActive = true;
        users[index].approvedBy = actor;
        users[index].approvedAt = now;
        break;
      case 'reject':
        users[index].status = 'rejected';
        users[index].isActive = false;
        (users[index] as any).rejectedBy = actor;
        (users[index] as any).rejectedAt = now;
        break;
      case 'block':
        users[index].status = 'blocked';
        users[index].isActive = false;
        (users[index] as any).blockedBy = actor;
        (users[index] as any).blockedAt = now;
        break;
      case 'unblock':
        users[index].status = 'approved';
        users[index].isActive = true;
        (users[index] as any).unblockedBy = actor;
        (users[index] as any).unblockedAt = now;
        break;
      case 'delete':
        users.splice(index, 1);
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        return NextResponse.json({ success: true, users });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}