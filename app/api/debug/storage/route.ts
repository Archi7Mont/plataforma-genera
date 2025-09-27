import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check KV configuration
    const isKvConfigured = () => {
      // Check for KV_REST_API_URL and KV_REST_API_TOKEN
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        return true;
      }
      // Check for UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        return true;
      }
      // Check for KV_REST_API_KV_REST_API_URL and KV_REST_API_KV_REST_API_TOKEN
      if (process.env.KV_REST_API_KV_REST_API_URL && process.env.KV_REST_API_KV_REST_API_TOKEN) {
        return true;
      }
      // Check for KV_REST_API_KV_URL (if there's a token with similar pattern)
      if (process.env.KV_REST_API_KV_URL && process.env.KV_REST_API_TOKEN) {
        return true;
      }
      return false;
    };

    // Test KV connection first
    let kvTestResult = null;
    if (isKvConfigured()) {
      try {
        const { kv } = await import('@vercel/kv');
        await kv.set('test_key', 'test_value');
        await kv.del('test_key'); // Clean up
        kvTestResult = 'SUCCESS';
      } catch (kvError) {
        kvTestResult = `ERROR: ${String(kvError)}`;
      }
    }

    const users = await store.getJson<any[]>('users', []);
    const passwords = await store.getJson<any[]>('generated_passwords', []);
    const loginAttempts = await store.getJson<any[]>('login_attempts', []);
    const securityEvents = await store.getJson<any[]>('system_logs', []);
    const questions = await store.getJson<any[]>('questions', []);
    const passwordResetRequests = await store.getJson<any[]>('password_reset_requests', []);

    return NextResponse.json({
      success: true,
      mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      kvConfigured: isKvConfigured(),
      kvTestResult,
      envVars: {
        NODE_ENV: process.env.NODE_ENV,
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'SET' : 'NOT SET',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT SET',
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? 'SET' : 'NOT SET',
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'NOT SET',
        KV_REST_API_KV_REST_API_URL: process.env.KV_REST_API_KV_REST_API_URL ? 'SET' : 'NOT SET',
        KV_REST_API_KV_REST_API_TOKEN: process.env.KV_REST_API_KV_REST_API_TOKEN ? 'SET' : 'NOT SET',
        KV_REST_API_KV_URL: process.env.KV_REST_API_KV_URL ? 'SET' : 'NOT SET',
      },
      data: {
        usersCount: users.length,
        passwordsCount: passwords.length,
        loginAttemptsCount: loginAttempts.length,
        securityEventsCount: securityEvents.length,
        questionsCount: questions.length,
        passwordResetRequestsCount: passwordResetRequests.length,
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


