import { NextRequest, NextResponse } from 'next/server'
import { AuthDB } from '@/lib/auth-db'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'overview'

    switch (type) {
      case 'overview':
        {
          const users = AuthDB.getAllUsers()
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
          const users = AuthDB.getAllUsers()
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
