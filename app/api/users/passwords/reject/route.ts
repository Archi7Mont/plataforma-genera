import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, rejectedBy } = await request.json()

    if (!email || !rejectedBy) {
      return NextResponse.json({ error: 'Email and rejectedBy are required' }, { status: 400 })
    }

    // Get current password states
    let passwords = await store.getJson<Array<{ email: string; plainPassword: string; generatedAt: string; approvedAt?: string; approvedBy?: string }>>('generated_passwords', [])

    // Remove the password entry
    const initialLength = passwords.length
    passwords = passwords.filter(p => p.email !== email)

    if (passwords.length === initialLength) {
      return NextResponse.json({ error: 'Password not found' }, { status: 404 })
    }

    // Save updated passwords
    await store.setJson('generated_passwords', passwords)

    return NextResponse.json({ success: true, message: 'Password rejected successfully' })
  } catch (error) {
    console.error('Error rejecting password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
