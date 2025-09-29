import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Skip database operations during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping database operations during build phase for questions');
      return NextResponse.json({
        success: true,
        questions: []
      });
    }

    const questions = await prisma.question.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, questions })
  } catch (error) {
    console.error('Questions GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load questions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Skip database operations during build phase
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping database operations during build phase for questions POST');
      return NextResponse.json({
        success: true,
        question: {
          id: 'build-phase-question',
          userName: 'Test User',
          userEmail: 'test@example.com',
          userEntity: 'Test Entity',
          userQuestion: 'Test question',
          createdAt: new Date().toISOString()
        }
      });
    }

    const body = await request.json()
    const { userName, userEmail, userEntity = '', userQuestion } = body || {}

    if (!userName || !userEmail || !userQuestion) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const question = await prisma.question.create({
      data: {
        id: `q-${Date.now()}`,
        userName,
        userEmail,
        userEntity,
        userQuestion
      }
    });

    return NextResponse.json({ success: true, question })
  } catch (error) {
    console.error('Questions POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit question' }, { status: 500 })
  }
}


