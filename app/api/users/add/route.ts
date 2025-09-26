import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, fullName = '', organization = '' } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Use same runtime path as other APIs (/tmp/data on Vercel)
    const repoDataDir = path.join(process.cwd(), 'data');
    const runtimeDataDir = process.env.VERCEL ? path.join('/tmp', 'data') : repoDataDir;
    if (!fs.existsSync(runtimeDataDir)) fs.mkdirSync(runtimeDataDir, { recursive: true });
    const usersFile = path.join(runtimeDataDir, 'users.json');
    if (!fs.existsSync(usersFile)) {
      const seedFile = path.join(repoDataDir, 'users.json');
      if (fs.existsSync(seedFile)) fs.copyFileSync(seedFile, usersFile); else fs.writeFileSync(usersFile, '[]');
    }
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    
    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      fullName,
      organization,
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
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    
    return NextResponse.json({ success: true, user: newUser, users });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}