import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Skip database operations during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping database operations during build phase for security dashboard');
      const mockData = {
        totalUsers: 1,
        pendingUsers: 0,
        failedLoginAttempts: 0,
        securityEvents: 0,
      };
      return NextResponse.json({
        success: true,
        data: request.url.includes('type=overview') ? mockData :
              request.url.includes('type=users') ? [] :
              request.url.includes('type=login-attempts') ? [] :
              request.url.includes('type=security-events') ? [] :
              request.url.includes('type=system-logs') ? [] :
              request.url.includes('type=failed-attempts') ? [] :
              request.url.includes('type=suspicious-activity') ? [] : []
      });
    }

    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'overview'

    switch (type) {
      case 'overview':
        {
          const users = await prisma.user.findMany()
          const data = {
            totalUsers: users.length,
            pendingUsers: users.filter(u => u.status === 'PENDING').length,
            failedLoginAttempts: 0, // Not implemented in current schema
            securityEvents: 0, // Not implemented in current schema
          }
          return NextResponse.json({ success: true, data })
        }

      case 'users':
        {
          const users = await prisma.user.findMany()
          return NextResponse.json({ success: true, data: users })
        }

      case 'login-attempts':
        {
          // Not implemented in current schema - return empty array
          return NextResponse.json({ success: true, data: [] })
        }

      case 'security-events':
        {
          // Not implemented in current schema - return empty array
          return NextResponse.json({ success: true, data: [] })
        }

      case 'system-logs':
        {
          // Not implemented in current schema - return empty array
          return NextResponse.json({ success: true, data: [] })
        }

      case 'failed-attempts':
        {
          // Not implemented in current schema - return empty array
          return NextResponse.json({ success: true, data: [] })
        }

      case 'suspicious-activity':
        {
          // Not implemented in current schema - return empty array
          return NextResponse.json({ success: true, data: [] })
        }

      default:
        return NextResponse.json({
          error: 'Invalid type parameter'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Security dashboard error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
