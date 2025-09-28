import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Generate secure password
function generateSecurePassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Simple hash function
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

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

    const tokenTimestamp = Math.floor(Date.now() / 1000);
    if (payload.exp < tokenTimestamp) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    if (!payload.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email } = await request.json();
    const emailNormalized = String(email || '').trim().toLowerCase();
    console.log('Received email:', email, 'Normalized:', emailNormalized);

    if (!emailNormalized) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Force KV in production - check if we have the right env vars
    if (process.env.NODE_ENV === 'production') {
      console.log('Production mode - checking KV config...');
      console.log('KV_REST_API_URL:', process.env.KV_REST_API_URL ? 'SET' : 'NOT SET');
      console.log('KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT SET');
    }

    const users = await store.getJson<any[]>('users', []);
    console.log('Current users count:', users.length);
    console.log('Looking for user with email:', emailNormalized);
    console.log('Available user emails:', users.map(u => u.email));

    // Find user
    const userIndex = users.findIndex(user => (user.email || '').toLowerCase() === emailNormalized);

    if (userIndex === -1) {
      console.log('User not found. Available users:', users.map(u => ({ email: u.email, status: u.status })));
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[userIndex];
    console.log('Found user:', user.email, 'Status:', user.status);

    // Check if user is approved
    if (user.status !== 'approved') {
      return NextResponse.json({ error: 'User must be approved before generating password' }, { status: 400 });
    }

    // Generate secure password
    const password = generateSecurePassword();
    const passwordHash = simpleHash(password);

    // Update user with password hash
    users[userIndex].passwordHash = passwordHash;
    console.log('Updated user:', users[userIndex].email, 'with password hash');
    
    // Save back
    console.log('Saving users to store...');
    await store.setJson('users', users);
    console.log('Users saved successfully');

    // Record plain password for admin display (transient log)
    const currentTimestamp = new Date().toISOString();
    let pwList = await store.getJson<Array<{ email: string; plainPassword: string; generatedAt: string }>>('generated_passwords', []);
    const idx = pwList.findIndex(p => (p.email || '').toLowerCase() === emailNormalized);
    const entry = { email: emailNormalized, plainPassword: password, generatedAt: currentTimestamp };
    if (idx >= 0) pwList[idx] = entry; else pwList.push(entry);
    console.log('Saving password list to store...');
    await store.setJson('generated_passwords', pwList);
    console.log('Password list saved successfully');

    // Verify data was saved
    const verifyUsers = await store.getJson<any[]>('users', []);
    const verifyPasswords = await store.getJson<any[]>('generated_passwords', []);
    console.log('Verification - Users count after save:', verifyUsers.length);
    console.log('Verification - Passwords count after save:', verifyPasswords.length);

    // Return success with password
    return NextResponse.json({ 
      success: true, 
      password: password,
      email: emailNormalized,
      debug: {
        usersCount: verifyUsers.length,
        passwordsCount: verifyPasswords.length
      }
    });

  } catch (error) {
    console.error('Error generating password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}