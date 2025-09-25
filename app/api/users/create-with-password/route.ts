import { NextRequest, NextResponse } from 'next/server'
import { 
  createUser, 
  getUserByEmail, 
  logSystemEvent 
} from '@/lib/database'
import { generateAndSavePassword } from '@/lib/passwordStorage'

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

    // Check if user already exists
    const existingUser = getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ 
        error: 'User already exists' 
      }, { status: 400 })
    }

    // Create user in database
    const newUser = createUser({
      email,
      fullName,
      organization: organization || '',
      position: position || '',
      role: role as 'admin' | 'user',
      status: role === 'admin' ? 'approved' : 'pending'
    })

    // Generate password for the user
    const password = await generateAndSavePassword(email, 'system', true)

    // Log user creation
    logSystemEvent('user_action', 'info', `User created with password: ${email}`, {
      userId: newUser.id,
      email,
      role,
      ipAddress,
      userAgent
    })

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
    logSystemEvent('system_event', 'error', 'User creation API error', { 
      error: error.message 
    })
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
