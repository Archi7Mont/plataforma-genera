import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

function getRuntimeDataDir() {
  const repoDataDir = path.join(process.cwd(), 'data')
  const runtimeDataDir = process.env.VERCEL ? path.join('/tmp', 'data') : repoDataDir
  if (!fs.existsSync(runtimeDataDir)) fs.mkdirSync(runtimeDataDir, { recursive: true })
  return { repoDataDir, runtimeDataDir }
}

function writeJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

async function performReset(request: NextRequest) {
  // Optional protection via header or query secret
  const resetSecret = process.env.RESET_SECRET
  if (resetSecret) {
    const providedHeader = request.headers.get('x-reset-secret')
    const providedQuery = new URL(request.url).searchParams.get('secret')
    if (providedHeader !== resetSecret && providedQuery !== resetSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { repoDataDir, runtimeDataDir } = getRuntimeDataDir()

  const usersFile = path.join(runtimeDataDir, 'users.json')
  const attemptsFile = path.join(runtimeDataDir, 'login_attempts.json')
  const logsFile = path.join(runtimeDataDir, 'system_logs.json')
  const passwordsFile = path.join(runtimeDataDir, 'generated_passwords.json')

  const adminUser = {
    id: '1',
    email: 'admin@genera.com',
    fullName: 'Administrator',
    organization: 'Géner.A System',
    position: 'System Administrator',
    status: 'approved',
    role: 'admin',
    passwordHash: 'Admin1234!',
    createdAt: '2024-09-24T15:52:00.000Z',
    lastLoginAt: null,
    loginCount: 0,
    isActive: true,
    approvedBy: 'system',
    approvedAt: '2024-09-24T15:52:00.000Z'
  }

  writeJson(usersFile, [adminUser])
  writeJson(attemptsFile, [])
  writeJson(logsFile, [])
  writeJson(passwordsFile, [])

  // Keep bundled seed in sync
  try {
    const repoUsersFile = path.join(repoDataDir, 'users.json')
    const repoAttemptsFile = path.join(repoDataDir, 'login_attempts.json')
    const repoLogsFile = path.join(repoDataDir, 'system_logs.json')
    const repoPasswordsFile = path.join(repoDataDir, 'generated_passwords.json')
    writeJson(repoUsersFile, [adminUser])
    writeJson(repoAttemptsFile, [])
    writeJson(repoLogsFile, [])
    writeJson(repoPasswordsFile, [])
  } catch {}

  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  try {
    return await performReset(request)
  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    return await performReset(request)
  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}


