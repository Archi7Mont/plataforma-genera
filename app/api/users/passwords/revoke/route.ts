import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, revokedBy } = await request.json()

    if (!email || !revokedBy) {
      return NextResponse.json({ error: 'Email and revokedBy are required' }, { status: 400 })
    }

    // Get current password states
    let passwords = await store.getJson<Array<{ email: string; plainPassword: string; generatedAt: string; approvedAt?: string; approvedBy?: string }>>('generated_passwords', [])

    // Find and revoke the password (remove approval metadata)
    const passwordIndex = passwords.findIndex(p => p.email === email)
    if (passwordIndex === -1) {
      return NextResponse.json({ error: 'Password not found' }, { status: 404 })
    }

    // Remove approval metadata but keep the password entry as "no_password" state
    delete passwords[passwordIndex].approvedAt
    delete passwords[passwordIndex].approvedBy

    // Save updated passwords
    await store.setJson('generated_passwords', passwords)

    return NextResponse.json({ success: true, message: 'Password revoked successfully' })
  } catch (error) {
    console.error('Error revoking password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
