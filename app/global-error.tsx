'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Error del Sistema</h1>
              <p className="text-lg text-gray-600 mb-8">
                Ha ocurrido un error inesperado. El equipo técnico ha sido notificado.
              </p>
              <button
                onClick={reset}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
              >
                Recargar aplicación
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
