// This route is deprecated - using the main login route instead
// Keeping for reference but not actively used

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'This endpoint is deprecated. Use /api/auth/login instead.',
    redirect: '/api/auth/login'
  }, { status: 410 })
}
