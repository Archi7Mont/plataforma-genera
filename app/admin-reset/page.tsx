"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

export default function AdminResetPage() {
  const [password, setPassword] = useState<string>("")
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    // Simple password setup for development
    try {
      const newPassword = "Admin1234!"
      
      // Store password in localStorage
      const passwordInfo = {
        email: "admin@genera.com",
        passwordHash: newPassword,
        generatedAt: new Date().toISOString(),
        generatedBy: "local-reset"
      }
      
      localStorage.setItem('genera_password_hashes', JSON.stringify([passwordInfo]))
      setPassword(newPassword)
      setDone(true)
    } catch (e) {
      console.error('Error:', e)
      setError('Error al establecer la contraseña')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Restablecer Admin</CardTitle>
            <CardDescription className="text-gray-600">
              Esta página temporal establece una contraseña local para admin@genera.com
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : done ? (
              <Alert>
                <AlertDescription>
                  Se configuró una nueva contraseña para <strong>admin@genera.com</strong>:
                  <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-sm">{password}</div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>Configurando contraseña...</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-between">
              <Button onClick={() => router.push("/login")} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Ir a Login
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Sugerencia: después de iniciar sesión, vaya a <code>/admin</code> y use
              "Generar Contraseña Admin" para crear una contraseña segura y copiarla.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}