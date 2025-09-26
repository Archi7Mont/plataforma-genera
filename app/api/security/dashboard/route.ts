import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'overview'

    switch (type) {
      case 'overview':
        {
          const users = await store.getJson<any[]>('users', [])
          const attempts = await store.getJson<any[]>('login_attempts', [])
          const events = await store.getJson<any[]>('system_logs', [])
          const data = {
            totalUsers: users.length,
            pendingUsers: users.filter(u => u.status === 'pending').length,
            failedLoginAttempts: attempts.filter(a => a && a.success === false).length,
            securityEvents: events.length,
          }
          return NextResponse.json({ success: true, data })
        }

      case 'users':
        {
          const users = await store.getJson<any[]>('users', [])
          return NextResponse.json({ success: true, data: users })
        }

      case 'login-attempts':
        {
          const attempts = await store.getJson<any[]>('login_attempts', [])
          const limit = parseInt(url.searchParams.get('limit') || '50')
          const recentAttempts = attempts
            .sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime())
            .slice(0, limit)
          return NextResponse.json({ success: true, data: recentAttempts })
        }

      case 'security-events':
        {
          const securityEvents = await store.getJson<any[]>('system_logs', [])
          const eventLimit = parseInt(url.searchParams.get('limit') || '20')
          const recentEvents = securityEvents
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, eventLimit)
          return NextResponse.json({ success: true, data: recentEvents })
        }

      case 'system-logs':
        {
          const logs = await store.getJson<any[]>('system_logs', [])
          const logLimit = parseInt(url.searchParams.get('limit') || '100')
          const recentLogs = logs
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, logLimit)
          return NextResponse.json({ success: true, data: recentLogs })
        }

      case 'failed-attempts':
        {
          const attempts = await store.getJson<any[]>('login_attempts', [])
          const failedAttempts = attempts
            .filter(attempt => !attempt.success)
            .sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime())
          return NextResponse.json({ success: true, data: failedAttempts })
        }

      case 'suspicious-activity':
        {
          const attempts = await store.getJson<any[]>('login_attempts', [])
          const suspiciousMap: Record<string, number> = {}
          for (const a of attempts) {
            if (!a || a.success) continue
            const ip = a.ipAddress || 'unknown'
            suspiciousMap[ip] = (suspiciousMap[ip] || 0) + 1
          }
          const suspiciousActivity = Object.entries(suspiciousMap)
            .filter(([_, count]) => count > 3)
            .map(([ip, count]) => ({ ip, failedAttempts: count }))
          return NextResponse.json({ success: true, data: suspiciousActivity })
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
