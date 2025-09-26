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

    const users = await store.getJson<any[]>('users', []);
    
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
    
    // Save back
    await store.setJson('users', users);

    // Record plain password for admin display (transient log)
    const now = new Date().toISOString();
    let pwList = await store.getJson<Array<{ email: string; plainPassword: string; generatedAt: string }>>('generated_passwords', []);
    const idx = pwList.findIndex(p => (p.email || '').toLowerCase() === emailNormalized);
    const entry = { email: emailNormalized, plainPassword: password, generatedAt: now };
    if (idx >= 0) pwList[idx] = entry; else pwList.push(entry);
    await store.setJson('generated_passwords', pwList);

    // Return success with password
    return NextResponse.json({ 
      success: true, 
      password: password,
      email: emailNormalized 
    });

  } catch (error) {
    console.error('Error generating password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}