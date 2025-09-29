import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Skip database operations during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping database operations during build phase for test-users');
      return NextResponse.json({
        success: true,
        users: [{
          id: 'test-user-1',
          email: 'test@example.com',
          fullName: 'Test User',
          organization: 'Test Org',
          status: 'APPROVED',
          role: 'USER',
          isActive: true,
          loginCount: 0,
          createdAt: new Date().toISOString()
        }],
        count: 1,
        message: 'Build phase - mock data returned'
      });
    }

    console.log('Testing users API...')
    const users = await prisma.user.findMany()
    console.log('Users from database:', users)

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
      message: 'Users loaded successfully'
    })
  } catch (error) {
    console.error('Error in test-users API:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      users: []
    }, { status: 500 })
  }
}
