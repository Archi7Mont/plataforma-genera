import { NextRequest, NextResponse } from 'next/server'
import { addUser } from '@/lib/users-db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const newUser = addUser(email)
    
    if (!newUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: newUser })
  } catch (error) {
    console.error('Error adding user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
