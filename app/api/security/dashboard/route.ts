import { NextRequest, NextResponse } from 'next/server'
import { 
  getSecurityDashboard,
  getAllUsers,
  getAllLoginAttempts,
  getSecurityEvents,
  getAllSystemLogs
} from '@/lib/database'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'overview'

    switch (type) {
      case 'overview':
        const dashboard = getSecurityDashboard()
        return NextResponse.json({ success: true, data: dashboard })

      case 'users':
        const users = getAllUsers()
        return NextResponse.json({ success: true, data: users })

      case 'login-attempts':
        const attempts = getAllLoginAttempts()
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const recentAttempts = attempts
          .sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime())
          .slice(0, limit)
        return NextResponse.json({ success: true, data: recentAttempts })

      case 'security-events':
        const securityEvents = getSecurityEvents()
        const eventLimit = parseInt(url.searchParams.get('limit') || '20')
        const recentEvents = securityEvents
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, eventLimit)
        return NextResponse.json({ success: true, data: recentEvents })

      case 'system-logs':
        const logs = getAllSystemLogs()
        const logLimit = parseInt(url.searchParams.get('limit') || '100')
        const recentLogs = logs
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, logLimit)
        return NextResponse.json({ success: true, data: recentLogs })

      case 'failed-attempts':
        const failedAttempts = getAllLoginAttempts()
          .filter(attempt => !attempt.success)
          .sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime())
        return NextResponse.json({ success: true, data: failedAttempts })

      case 'suspicious-activity':
        const suspiciousIPs = getSecurityDashboard().suspiciousIPs
        const suspiciousActivity = Object.entries(suspiciousIPs)
          .filter(([ip, count]) => count > 3)
          .map(([ip, count]) => ({ ip, failedAttempts: count }))
        return NextResponse.json({ success: true, data: suspiciousActivity })

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
