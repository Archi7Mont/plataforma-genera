import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return NextResponse.json({
        success: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          isAdmin: decoded.isAdmin
        }
      });
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { success: false, error: 'Token expired' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
