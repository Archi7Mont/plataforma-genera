import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Testing users API...')
    const users = await store.getJson<any[]>('users', [])
    console.log('Users from store:', users)

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
