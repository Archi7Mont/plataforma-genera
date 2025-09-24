import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple JWT verification for Edge Runtime compatibility
function verifyJWT(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp < now) return null; // Token expired
    
    return payload;
  } catch (error) {
    return null;
  }
}

// Define protected routes
const protectedRoutes = ['/dashboard', '/admin'];
const adminRoutes = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get token from Authorization header or cookie
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value || request.cookies.get('auth_token')?.value;

  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  const decodedToken = verifyJWT(token);
  if (!decodedToken) {
    // Redirect to login if token is invalid
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check admin access for admin routes
  if (isAdminRoute && !decodedToken.isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add user info to headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', decodedToken.userId);
  requestHeaders.set('x-user-email', decodedToken.email);
  requestHeaders.set('x-user-admin', decodedToken.isAdmin.toString());

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};
