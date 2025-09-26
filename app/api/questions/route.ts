import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

type Question = {
  id: string
  userName: string
  userEmail: string
  userEntity?: string
  userQuestion: string
  createdAt: string
}

function getRuntimeDataDir() {
  const repoDataDir = path.join(process.cwd(), 'data')
  const runtimeDataDir = process.env.VERCEL ? path.join('/tmp', 'data') : repoDataDir
  if (!fs.existsSync(runtimeDataDir)) fs.mkdirSync(runtimeDataDir, { recursive: true })
  return { repoDataDir, runtimeDataDir }
}

function getQuestionsFile() {
  const { repoDataDir, runtimeDataDir } = getRuntimeDataDir()
  const filePath = path.join(runtimeDataDir, 'questions.json')
  if (!fs.existsSync(filePath)) {
    try {
      const seed = path.join(repoDataDir, 'questions.json')
      if (fs.existsSync(seed)) fs.copyFileSync(seed, filePath)
      else fs.writeFileSync(filePath, '[]')
    } catch {
      fs.writeFileSync(filePath, '[]')
    }
  }
  return filePath
}

export async function GET() {
  try {
    const file = getQuestionsFile()
    const questions: Question[] = JSON.parse(fs.readFileSync(file, 'utf8'))
    questions.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    return NextResponse.json({ success: true, questions })
  } catch (error) {
    console.error('Questions GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load questions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userName, userEmail, userEntity = '', userQuestion } = body || {}

    if (!userName || !userEmail || !userQuestion) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const file = getQuestionsFile()
    const questions: Question[] = JSON.parse(fs.readFileSync(file, 'utf8'))
    const q: Question = {
      id: Date.now().toString(),
      userName,
      userEmail,
      userEntity,
      userQuestion,
      createdAt: new Date().toISOString()
    }
    questions.push(q)
    fs.writeFileSync(file, JSON.stringify(questions, null, 2))
    return NextResponse.json({ success: true, question: q })
  } catch (error) {
    console.error('Questions POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit question' }, { status: 500 })
  }
}


