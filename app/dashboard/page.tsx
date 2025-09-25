"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { NavigationButtons } from "@/components/navigation-buttons"

interface User {
  email: string
  status: "pending" | "approved" | "rejected"
  loginTime: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const verifyAuth = async () => {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        return
      }

      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const result = await response.json()
        
        if (!result.success) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem("auth_token")
            localStorage.removeItem("genera_user")
          }
          router.push("/login")
          return
        }

        if (typeof window !== 'undefined') {
          const userData = localStorage.getItem("genera_user")
          if (userData) {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
          } else {
            router.push("/login")
          }
        }
      } catch (error) {
        console.error('Auth verification failed:', error)
        if (typeof window !== 'undefined') {
          localStorage.removeItem("auth_token")
          localStorage.removeItem("genera_user")
        }
        router.push("/login")
      }
    }

    verifyAuth()
  }, [router])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("genera_user")
    }
    router.push("/")
  }

  if (!user) {
    return <div>Cargando...</div>
  }

  if (user.status === "pending") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Cuenta Pendiente de Aprobación</CardTitle>
            <CardDescription>Su cuenta está siendo revisada por un administrador</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">
              Estado: Pendiente
            </Badge>
            <p className="text-sm text-muted-foreground">Recibirá una notificación cuando su cuenta sea aprobada.</p>
            <Button onClick={handleLogout} variant="outline" className="w-full bg-transparent">
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                Géner.A
              </h1>
              <span className="text-gray-600">Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              {user?.email === "admin@genera.com" && (
                <Link href="/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                  >
                    Panel Admin
                  </Button>
                </Link>
              )}
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-purple-700 mb-2">Índices Disponibles</h2>
          <p className="text-gray-600">Seleccione un índice para comenzar el análisis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/indices/impgai-regional/configuracion-simple">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:scale-105 hover:border-purple-200 bg-white h-44 md:h-48 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg text-purple-600">IMPGAI Regional</CardTitle>
                <CardDescription>Índice de Medición de la Perspectiva de Género en el Ámbito Institucional- Versión Regional</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/indices/impgai-nacional">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:scale-105 hover:border-purple-200 bg-white h-44 md:h-48 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg text-purple-600">IMPGAI Nacional</CardTitle>
                <CardDescription>Índice de Medición de la Perspectiva de Género en el Ámbito Institucional - Versión Nacional</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/indices/impgpp-regional/configuracion">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:scale-105 hover:border-purple-200 bg-white h-44 md:h-48 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg text-purple-600">IMPGPP Regional</CardTitle>
                <CardDescription>Índice de Medición de la Perspectiva de Género en las Políticas Públicas - Versión Regional</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/indices/impgpp-nacional">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:scale-105 hover:border-purple-200 bg-white h-44 md:h-48 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg text-purple-600">IMPGPP Nacional</CardTitle>
                <CardDescription>Índice de Medición de la Perspectiva de Género en las Políticas Públicas - Versión Nacional</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/FAQ.html">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:scale-105 hover:border-purple-200 bg-white h-44 md:h-48 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg text-purple-600">FAQ</CardTitle>
                <CardDescription>Preguntas frecuentes sobre la metodología</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <NavigationButtons previousPage={{ href: "/", label: "Página Principal" }} showHome={false} />
      </main>
    </div>
  )
}
