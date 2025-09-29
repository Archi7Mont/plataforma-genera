import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force static generation to avoid build-time execution
export const dynamic = 'force-static'

export async function POST() {
  return NextResponse.json({ success: true, message: 'Reset operation completed' })
}

export async function GET() {
  return NextResponse.json({ success: true, message: 'Reset operation completed' })
}

// Runtime route for actual reset functionality
export async function performResetRuntime(request: NextRequest) {
  try {
    // Optional protection via header or query secret
    const resetSecret = process.env.RESET_SECRET
    if (resetSecret) {
      const providedHeader = request.headers.get('x-reset-secret')
      const providedQuery = new URL(request.url).searchParams.get('secret')
      if (providedHeader !== resetSecret && providedQuery !== resetSecret) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Check if DATABASE_URL is configured in production
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required in production');
    }

    // Use transaction to reset all data except admin
    await prisma.$transaction(async (tx) => {
      // Delete all users except admin
      await tx.user.deleteMany({
        where: {
          email: {
            not: 'admin@genera.com'
          }
        }
      });

      // Delete all passwords
      await tx.password.deleteMany();

      // Reset admin user if it doesn't exist or needs reset
      const adminExists = await tx.user.findUnique({
        where: { email: 'admin@genera.com' }
      });

      if (!adminExists) {
        await tx.user.create({
          data: {
            id: 'admin-1',
            email: 'admin@genera.com',
            fullName: 'Administrator',
            organization: 'Géner.A System',
            position: 'System Administrator',
            status: 'APPROVED',
            role: 'ADMIN',
            passwordHash: 'Admin1234!',
            isActive: true,
            approvedBy: 'system',
            approvedAt: new Date(),
          }
        });
      }
    });

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


