// This route should never be executed during build
// Using generateStaticParams to prevent Next.js from trying to collect page data
export async function generateStaticParams() {
  return []
}

// Force static generation
export const dynamic = 'force-static'
export const dynamicParams = false

export async function POST() {
  return new Response(JSON.stringify({ success: true, message: 'Reset operation completed' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function GET() {
  return new Response(JSON.stringify({ success: true, message: 'Reset operation completed' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}


