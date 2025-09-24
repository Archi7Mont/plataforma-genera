import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail, sanitizeInput } from '@/lib/auth';

// Simple password verification for development
function simpleVerify(password: string, hash: string): boolean {
  let passwordHash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    passwordHash = ((passwordHash << 5) - passwordHash) + char;
    passwordHash = passwordHash & passwordHash; // Convert to 32bit integer
  }
  return passwordHash.toString() === hash;
}

// Simple JWT implementation for Edge Runtime compatibility
function createJWT(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60) // 24 hours
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(tokenPayload));
  const signature = btoa('mock-signature'); // In production, use proper HMAC
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Read password hashes sent from client (from localStorage)
    // This enables the dev-only persistence of generated admin passwords
    const hashesHeader = request.headers.get('x-password-hashes') || '[]';
    let clientPasswordHashes: Array<{ email: string; passwordHash: string }>; 
    try {
      clientPasswordHashes = JSON.parse(hashesHeader);
      if (!Array.isArray(clientPasswordHashes)) clientPasswordHashes = [];
    } catch {
      clientPasswordHashes = [];
    }
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Simple authentication for development
    // Check for admin user
    if (sanitizedEmail === "admin@genera.com") {
      // For admin, check against a hardcoded password for development
      const adminPassword = "Admin1234!";

      if (password !== adminPassword) {
        // Try to validate against hashes provided by client
        const entry = clientPasswordHashes.find((p) => p.email === sanitizedEmail);
        if (!entry) {
          return NextResponse.json(
            { success: false, error: 'Invalid credentials' },
            { status: 401 }
          );
        }

        // Accept either plaintext (from /admin-reset) or hashed (from admin panel)
        const isPlainMatch = password === entry.passwordHash;
        const isHashMatch = simpleVerify(password, entry.passwordHash);
        if (!isPlainMatch && !isHashMatch) {
          return NextResponse.json(
            { success: false, error: 'Invalid credentials' },
            { status: 401 }
          );
        }
      }
    } else {
      // For regular users, we'd normally check against a database
      // For now, reject non-admin users
      return NextResponse.json(
        { success: false, error: 'User not found or account not approved' },
        { status: 401 }
      );
    }

    // For development, create a simple admin user object
    const userData = {
      id: 'admin-id',
      email: sanitizedEmail,
      isAdmin: true,
      status: 'approved'
    };

    // Generate JWT token
    const token = createJWT({
      userId: userData.id,
      email: sanitizedEmail,
      isAdmin: userData.isAdmin || sanitizedEmail === 'admin@genera.com'
    });

    // Return success with token
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: userData.id,
        email: sanitizedEmail,
        status: userData.status,
        isAdmin: userData.isAdmin || sanitizedEmail === 'admin@genera.com'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
