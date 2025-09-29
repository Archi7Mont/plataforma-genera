import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function performReset(request: NextRequest) {
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

    // Only run database operations if we're not in build mode
    // During build, Next.js might call this route to collect metadata
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping database operations during build phase');
      return NextResponse.json({ success: true, message: 'Build phase - no operations performed' });
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
    // During build phase, just return success to avoid breaking the build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Build phase error - returning success:', error);
      return NextResponse.json({ success: true, message: 'Build phase - operation skipped' });
    }

    console.error('Reset error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return await performReset(request)
  } catch (error) {
    // During build phase, just return success to avoid breaking the build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Build phase POST error - returning success:', error);
      return NextResponse.json({ success: true, message: 'Build phase - operation skipped' });
    }

    console.error('Reset POST error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    return await performReset(request)
  } catch (error) {
    // During build phase, just return success to avoid breaking the build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Build phase GET error - returning success:', error);
      return NextResponse.json({ success: true, message: 'Build phase - operation skipped' });
    }

    console.error('Reset GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}


