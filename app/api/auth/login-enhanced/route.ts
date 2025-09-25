import { NextRequest, NextResponse } from 'next/server'
import { 
  getUserByEmail, 
  updateUser, 
  recordLoginAttempt, 
  checkSuspiciousActivity,
  logSystemEvent 
} from '@/lib/database'
import { verifyUserPassword } from '@/lib/passwordStorage'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Check for suspicious activity
    const isSuspicious = checkSuspiciousActivity(email, ipAddress)
    if (isSuspicious) {
      logSystemEvent('security_event', 'warning', `Suspicious login activity detected for ${email}`, {
        email,
        ipAddress,
        userAgent
      })
    }

    // Get user from database
    const user = getUserByEmail(email)
    
    if (!user) {
      // Record failed attempt
      recordLoginAttempt({
        email,
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'User not found',
        attemptedAt: new Date().toISOString()
      })
      
      logSystemEvent('security_event', 'warning', `Login attempt with non-existent email: ${email}`, {
        email,
        ipAddress,
        userAgent
      })
      
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Check if user is active
    if (!user.isActive) {
      recordLoginAttempt({
        email,
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'Account inactive',
        attemptedAt: new Date().toISOString(),
        userId: user.id
      })
      
      return NextResponse.json({ error: 'Account is inactive' }, { status: 401 })
    }

    // Check if user is approved
    if (user.status !== 'approved') {
      recordLoginAttempt({
        email,
        ipAddress,
        userAgent,
        success: false,
        failureReason: `Account status: ${user.status}`,
        attemptedAt: new Date().toISOString(),
        userId: user.id
      })
      
      return NextResponse.json({ 
        error: 'Account pending approval',
        status: user.status 
      }, { status: 401 })
    }

    // Verify password
    const isValid = await verifyUserPassword(email, password)
    
    if (!isValid) {
      // Record failed attempt
      recordLoginAttempt({
        email,
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'Invalid password',
        attemptedAt: new Date().toISOString(),
        userId: user.id
      })
      
      logSystemEvent('security_event', 'warning', `Failed login attempt for ${email}`, {
        email,
        ipAddress,
        userAgent,
        userId: user.id
      })
      
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Update user login info
    updateUser(user.id, {
      lastLoginAt: new Date().toISOString(),
      loginCount: user.loginCount + 1
    })

    // Record successful attempt
    recordLoginAttempt({
      email,
      ipAddress,
      userAgent,
      success: true,
      attemptedAt: new Date().toISOString(),
      userId: user.id
    })

    // Create a simple token (in production, use JWT)
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
    
    // Prepare user data
    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      organization: user.organization,
      position: user.position,
      isAdmin: user.role === 'admin',
      loginTime: new Date().toISOString()
    }

    // Log successful login
    logSystemEvent('user_action', 'info', `Successful login: ${email}`, {
      email,
      ipAddress,
      userAgent,
      userId: user.id
    })

    return NextResponse.json({ 
      success: true, 
      token,
      user: userData
    })
  } catch (error) {
    console.error('Login error:', error)
    logSystemEvent('system_event', 'error', 'Login API error', { error: error.message })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
