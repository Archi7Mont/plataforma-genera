import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check DATABASE_URL configuration
    const dbConfigured = process.env.DATABASE_URL ? 'CONFIGURED' : 'NOT SET';

    // Test database connection
    let dbTestResult = null;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbTestResult = 'SUCCESS';
    } catch (dbError) {
      dbTestResult = `ERROR: ${String(dbError)}`;
    }

    const users = await prisma.user.findMany();
    const passwords = await prisma.password.findMany();

    return NextResponse.json({
      success: true,
      mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      dbConfigured: dbConfigured,
      dbTestResult,
      envVars: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      },
      data: {
        usersCount: users.length,
        passwordsCount: passwords.length,
        loginAttemptsCount: 0, // Not implemented in Postgres schema
        securityEventsCount: 0, // Not implemented in Postgres schema
        questionsCount: 0, // Not implemented in Postgres schema
        passwordResetRequestsCount: 0, // Not implemented in Postgres schema
      },
      sampleData: {
        users: users.slice(0, 3), // Show first 3 users
        passwords: passwords.slice(0, 3), // Show first 3 passwords
      }
    });
  } catch (error) {
    console.error('Debug storage error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      stack: error instanceof Error ? error.stack : 'No stack'
    }, { status: 500 });
  }
}


