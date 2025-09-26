import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const mode = (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ? 'kv' : 'fs'
    const users = await store.getJson<any[]>('users', [])
    const passwords = await store.getJson<any[]>('generated_passwords', [])
    return NextResponse.json({ success: true, mode, usersCount: users.length, passwordsCount: passwords.length })
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message })
  }
}


