import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, organization, position, role = 'user' } = await request.json()
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (!email || !fullName) {
      return NextResponse.json({
        error: 'Email and full name are required'
      }, { status: 400 })
    }

    // Get existing users
    const users = await store.getJson<any[]>('users', [])

    // Check if user already exists
    const existingUser = users.find((user: any) => (user.email || '').toLowerCase() === email.toLowerCase())
    if (existingUser) {
      return NextResponse.json({
        error: 'User already exists'
      }, { status: 400 })
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      fullName,
      organization: organization || '',
      position: position || '',
      status: role === 'admin' ? 'approved' : 'pending',
      role: role as 'admin' | 'user',
      passwordHash: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      loginCount: 0,
      isActive: true,
      approvedBy: null,
      approvedAt: null
    }

    // Save user to store
    users.push(newUser)
    await store.setJson('users', users)

    // Generate password for the user (this would need to be implemented)
    // For now, return success without password generation
    const password = 'temp-password' // This should be replaced with actual password generation

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        organization: newUser.organization,
        position: newUser.position,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt
      },
      password // Return the generated password
    })
  } catch (error) {
    console.error('Error creating user with password:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
