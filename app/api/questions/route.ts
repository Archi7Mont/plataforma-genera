import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// In-memory questions store (simple fallback)
let questionsStore: any[] = [];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      questions: questionsStore
    });
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

    const question = {
      id: `q-${Date.now()}`,
      userName,
      userEmail,
      userEntity,
      userQuestion,
      createdAt: new Date().toISOString()
    };
    
    questionsStore.push(question);

    return NextResponse.json({ success: true, question })
  } catch (error) {
    console.error('Questions POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit question' }, { status: 500 })
  }
}


