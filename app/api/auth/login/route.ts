// This route should never execute during build
export const dynamic = 'force-static'

export async function POST() {
  // During build time, return static response to prevent database access
  if (process.env.NEXT_PHASE === 'phase-production-build' ||
      (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Service temporarily unavailable during deployment'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // This route will be implemented with actual authentication logic at runtime
  return new Response(JSON.stringify({
    success: false,
    error: 'Authentication endpoint - configure DATABASE_URL first'
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}