import { NextRequest, NextResponse } from 'next/server'
import { readUsers, updateUserStatus, addUser } from '@/lib/users-db'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const users = readUsers()
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error reading users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, ...updateData } = body

    let users: any[] = []

    switch (action) {
      case 'approve':
        users = updateUserStatus(userId, 'approved', updateData.approvedBy || 'admin')
        break

      case 'reject':
        users = updateUserStatus(userId, 'rejected', updateData.rejectedBy || 'admin')
        break

      case 'block':
        users = updateUserStatus(userId, 'blocked', updateData.blockedBy || 'admin')
        break

      case 'unblock':
        users = updateUserStatus(userId, 'approved', updateData.unblockedBy || 'admin')
        break

      case 'delete':
        users = updateUserStatus(userId, 'deleted', updateData.deletedBy || 'admin')
        break

      case 'add':
        const newUser = addUser(updateData.email)
        if (!newUser) {
          return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }
        users = readUsers()
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('Error updating users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
