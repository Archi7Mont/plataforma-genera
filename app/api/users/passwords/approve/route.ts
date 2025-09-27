import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, approvedBy } = await request.json()

    if (!email || !approvedBy) {
      return NextResponse.json({ error: 'Email and approvedBy are required' }, { status: 400 })
    }

    // Get current password states
    let passwords = await store.getJson<Array<{ email: string; plainPassword: string; generatedAt: string; approvedAt?: string; approvedBy?: string }>>('generated_passwords', [])

    // Find and approve the password
    const passwordIndex = passwords.findIndex(p => p.email === email)
    if (passwordIndex === -1) {
      return NextResponse.json({ error: 'Password not found' }, { status: 404 })
    }

    // Update password state
    passwords[passwordIndex].approvedAt = new Date().toISOString()
    passwords[passwordIndex].approvedBy = approvedBy

    // Save updated passwords
    await store.setJson('generated_passwords', passwords)

    return NextResponse.json({ success: true, message: 'Password approved successfully' })
  } catch (error) {
    console.error('Error approving password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
