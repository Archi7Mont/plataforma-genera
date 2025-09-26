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
    const { email } = await request.json();
    const emailNormalized = String(email || '').trim().toLowerCase();

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
    
    // Find user
    const userIndex = users.findIndex(user => (user.email || '').toLowerCase() === emailNormalized);
    
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
    const now = new Date().toISOString();
    let pwList = await store.getJson<Array<{ email: string; plainPassword: string; generatedAt: string }>>('generated_passwords', []);
    const idx = pwList.findIndex(p => (p.email || '').toLowerCase() === emailNormalized);
    const entry = { email: emailNormalized, plainPassword: password, generatedAt: now };
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