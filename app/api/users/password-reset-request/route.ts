import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

type ResetRequest = {
  id: string
  email: string
  requestedAt: string
  status: 'pending' | 'processed'
}

function getRuntimeDataDir() {
  const repoDataDir = path.join(process.cwd(), 'data')
  const runtimeDataDir = process.env.VERCEL ? path.join('/tmp', 'data') : repoDataDir
  if (!fs.existsSync(runtimeDataDir)) fs.mkdirSync(runtimeDataDir, { recursive: true })
  return { repoDataDir, runtimeDataDir }
}

function ensureFile(filePath: string, seedPath?: string) {
  if (!fs.existsSync(filePath)) {
    if (seedPath && fs.existsSync(seedPath)) fs.copyFileSync(seedPath, filePath)
    else fs.writeFileSync(filePath, '[]')
  }
}

export async function GET() {
  try {
    const { repoDataDir, runtimeDataDir } = getRuntimeDataDir()
    const file = path.join(runtimeDataDir, 'password_reset_requests.json')
    ensureFile(file, path.join(repoDataDir, 'password_reset_requests.json'))
    const requests: ResetRequest[] = JSON.parse(fs.readFileSync(file, 'utf8'))
    requests.sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''))
    return NextResponse.json({ success: true, requests })
  } catch (error) {
    console.error('Read reset requests error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    const { repoDataDir, runtimeDataDir } = getRuntimeDataDir()
    const usersFile = path.join(runtimeDataDir, 'users.json')
    ensureFile(usersFile, path.join(repoDataDir, 'users.json'))
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'))
    const user = users.find((u: any) => u.email === email)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const file = path.join(runtimeDataDir, 'password_reset_requests.json')
    ensureFile(file, path.join(repoDataDir, 'password_reset_requests.json'))
    const requests: ResetRequest[] = JSON.parse(fs.readFileSync(file, 'utf8'))
    const now = new Date().toISOString()
    const newRequest: ResetRequest = { id: Date.now().toString(), email, requestedAt: now, status: 'pending' }
    requests.push(newRequest)
    fs.writeFileSync(file, JSON.stringify(requests, null, 2))
    return NextResponse.json({ success: true, request: newRequest })
  } catch (error) {
    console.error('Create reset request error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create request' }, { status: 500 })
  }
}


