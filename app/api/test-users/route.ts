import { NextResponse } from 'next/server'
import { getAllUsers } from '@/lib/database'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Testing users API...')
    const users = getAllUsers()
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
      error: error.message,
      users: []
    }, { status: 500 })
  }
}
