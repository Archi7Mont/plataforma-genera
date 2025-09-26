import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Simple password verification
function simpleVerify(password: string, hash: string): boolean {
  let passwordHash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    passwordHash = ((passwordHash << 5) - passwordHash) + char;
    passwordHash = passwordHash & passwordHash; // Convert to 32-bit integer
  }
  return passwordHash.toString() === hash;
}

// Simple JWT implementation
function createJWT(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payloadWithExp = { ...payload, iat: now, exp: now + (24 * 60 * 60) }; // 24 hours
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payloadWithExp)).toString('base64url');
  const signature = 'mock-signature'; // In production, use proper HMAC
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Simple input sanitization
function sanitizeInput(input: string): string {
  return input.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeInput(email);
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Read users from database (support Vercel /tmp writeable dir)
    const repoDataDir = path.join(process.cwd(), 'data');
    const runtimeDataDir = process.env.VERCEL ? path.join('/tmp', 'data') : repoDataDir;
    if (!fs.existsSync(runtimeDataDir)) fs.mkdirSync(runtimeDataDir, { recursive: true });
    const usersFile = path.join(runtimeDataDir, 'users.json');
    if (!fs.existsSync(usersFile)) {
      const seedFile = path.join(repoDataDir, 'users.json');
      if (fs.existsSync(seedFile)) {
        fs.copyFileSync(seedFile, usersFile);
      } else {
        const now = new Date().toISOString();
        const seed = [
          {
            id: '1',
            email: 'admin@genera.com',
            fullName: 'Administrator',
            organization: 'Géner.A System',
            position: 'System Administrator',
            status: 'approved',
            role: 'admin',
            passwordHash: 'Admin1234!',
            createdAt: now,
            lastLoginAt: null,
            loginCount: 0,
            isActive: true,
            approvedBy: 'system',
            approvedAt: now
          }
        ];
        fs.writeFileSync(usersFile, JSON.stringify(seed, null, 2));
      }
    }
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    
    // Find user
    let user = users.find((u: any) => u.email === sanitizedEmail);
    
    // Auto-create pending user on first login attempt so it shows in admin dashboard
    if (!user) {
      const nowIso = new Date().toISOString();
      user = {
        id: Date.now().toString(),
        email: sanitizedEmail,
        fullName: '',
        organization: '',
        position: '',
        status: 'pending',
        role: 'user',
        passwordHash: null,
        createdAt: nowIso,
        lastLoginAt: null,
        loginCount: 0,
        isActive: true,
        approvedBy: null,
        approvedAt: null
      } as any;
      users.push(user);
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

      // Inform client that account is pending approval
      return NextResponse.json(
        { success: false, error: 'Account pending approval' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 401 }
      );
    }

    // Check if user is approved
    if (user.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Account pending approval' },
        { status: 401 }
      );
    }

    // Verify password
    let isValid = false;
    
    // Special case for admin user
    if (sanitizedEmail === 'admin@genera.com' && password === 'Admin1234!') {
      isValid = true;
    } else if (user.passwordHash) {
      // Check if it's a plain text password or a hash
      if (user.passwordHash === password) {
        isValid = true;
      } else {
        isValid = simpleVerify(password, user.passwordHash);
      }
    }
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update user login info
    const userIndex = users.findIndex(u => u.email === sanitizedEmail);
    if (userIndex !== -1) {
      users[userIndex].lastLoginAt = new Date().toISOString();
      users[userIndex].loginCount = (users[userIndex].loginCount || 0) + 1;
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    }

    // Generate JWT token
    const token = createJWT({
      userId: user.id,
      email: sanitizedEmail,
      isAdmin: user.role === 'admin'
    });

    // Prepare user data
    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      organization: user.organization,
      position: user.position,
      isAdmin: user.role === 'admin',
      status: user.status
    };

    // Return success with token
    return NextResponse.json({
      success: true,
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}