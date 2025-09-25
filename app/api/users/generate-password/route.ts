import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Read users from database with /tmp support
    const repoDataDir = path.join(process.cwd(), 'data');
    const runtimeDataDir = process.env.VERCEL ? path.join('/tmp', 'data') : repoDataDir;
    if (!fs.existsSync(runtimeDataDir)) fs.mkdirSync(runtimeDataDir, { recursive: true });
    const usersFile = path.join(runtimeDataDir, 'users.json');
    if (!fs.existsSync(usersFile)) {
      const seedFile = path.join(repoDataDir, 'users.json');
      if (fs.existsSync(seedFile)) fs.copyFileSync(seedFile, usersFile); else fs.writeFileSync(usersFile, '[]');
    }
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    
    // Find user
    const userIndex = users.findIndex(user => user.email === email);
    
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate secure password
    const password = generateSecurePassword();
    const passwordHash = simpleHash(password);

    // Update user with password hash
    users[userIndex].passwordHash = passwordHash;
    
    // Save back to file
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    // Record plain password for admin display (transient log)
    const pwFile = path.join(runtimeDataDir, 'generated_passwords.json');
    const now = new Date().toISOString();
    let pwList: Array<{ email: string; plainPassword: string; generatedAt: string }>; 
    if (fs.existsSync(pwFile)) {
      try {
        pwList = JSON.parse(fs.readFileSync(pwFile, 'utf8'));
      } catch {
        pwList = [];
      }
    } else {
      pwList = [];
    }
    const idx = pwList.findIndex(p => p.email === email);
    const entry = { email, plainPassword: password, generatedAt: now };
    if (idx >= 0) pwList[idx] = entry; else pwList.push(entry);
    fs.writeFileSync(pwFile, JSON.stringify(pwList, null, 2));

    // Return success with password
    return NextResponse.json({ 
      success: true, 
      password: password,
      email: email 
    });

  } catch (error) {
    console.error('Error generating password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}