import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Página no encontrada
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            La página que estás buscando no existe o ha sido movida.
          </p>
          <Link href="/">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
