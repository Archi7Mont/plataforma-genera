"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { NavigationButtons } from "@/components/navigation-buttons"
import ReCAPTCHA from "react-google-recaptcha"
import { generateAndSavePassword } from "@/lib/passwordStorage"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const handleCaptchaChange = (value: string | null) => {
    setCaptchaVerified(!!value)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    const captchaOk = captchaVerified || isLocalhost

    if (!captchaOk) {
      setError("Por favor complete la verificación reCAPTCHA")
      return
    }

    if (!email || !password) {
      setError("Por favor complete todos los campos")
      return
    }

    setIsLoading(true)

    try {
      // Verify reCAPTCHA token with server (skip on localhost)
      const recaptchaToken = recaptchaRef.current?.getValue()
      
      if (!recaptchaToken && !isLocalhost) {
        setError("Error de verificación reCAPTCHA")
        setIsLoading(false)
        return
      }

      // Verify reCAPTCHA token with backend
      if (!isLocalhost) {
        const verifyResponse = await fetch('/api/verify-recaptcha', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: recaptchaToken }),
        })

        let verifyResult: any = null
        try {
          verifyResult = await verifyResponse.json()
        } catch (err) {
          // If parsing fails in non-localhost, treat as failure
          setError("Verificación reCAPTCHA fallida. Intente nuevamente.")
          setIsLoading(false)
          return
        }
        
        if (!verifyResult?.success) {
          setError("Verificación reCAPTCHA fallida. Intente nuevamente.")
          setIsLoading(false)
          return
        }
      }

      // Log the verification result for debugging
      if (!isLocalhost) {
        console.log('reCAPTCHA verification result: OK')
      } else {
        console.log('reCAPTCHA verification bypass: localhost')
      }

      // Get user data for the API call (client-side only)
      const allUsers = typeof window !== 'undefined' ? localStorage.getItem("genera_all_users") : null
      const users = allUsers ? JSON.parse(allUsers) : []

      // Collect client-stored password hashes for dev-only validation
      const hashesRaw = typeof window !== 'undefined' ? localStorage.getItem('genera_password_hashes') : null
      const passwordHashes = hashesRaw ? JSON.parse(hashesRaw) : []

      // Call server-side authentication
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-users-data': JSON.stringify(users),
          'x-password-hashes': JSON.stringify(passwordHashes)
        },
        body: JSON.stringify({ email, password }),
      })

      const loginResult = await loginResponse.json()

      if (!loginResult.success) {
        setError(loginResult.error || "Error de autenticación")
        setIsLoading(false)
        return
      }

      // Store token and user data (client-side only)
      if (typeof window !== 'undefined') {
        // Store in localStorage for client-side access
        localStorage.setItem("auth_token", loginResult.token)
        localStorage.setItem("genera_user", JSON.stringify(loginResult.user))

        // Set token in cookie for middleware access
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
        const secureAttr = isHttps ? '; Secure' : ''
        document.cookie = `auth-token=${loginResult.token}; path=/; max-age=${60 * 60 * 24}; SameSite=Strict${secureAttr}`

        // Update user list if needed
        const userExists = users.find((u: any) => u.email === email)
        if (!userExists) {
          users.push({
            id: loginResult.user.id,
            email: loginResult.user.email,
            status: loginResult.user.status,
            loginTime: new Date().toISOString(),
          })
          localStorage.setItem("genera_all_users", JSON.stringify(users))
        }
      }

      router.push("/dashboard")
      setIsLoading(false)
    } catch (error) {
      if (!isLocalhost) {
        setError("Error en la verificación. Intente nuevamente.")
        setIsLoading(false)
      } else {
        // On localhost, proceed despite verification errors
        try {
          const allUsers = typeof window !== 'undefined' ? localStorage.getItem("genera_all_users") : null
          const users = allUsers ? JSON.parse(allUsers) : []
          const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-users-data': JSON.stringify(users),
              'x-password-hashes': JSON.stringify([])
            },
            body: JSON.stringify({ email, password }),
          })
          const loginResult = await loginResponse.json()
          if (!loginResult.success) {
            setError(loginResult.error || "Error de autenticación")
            setIsLoading(false)
            return
          }
          if (typeof window !== 'undefined') {
            localStorage.setItem("auth_token", loginResult.token)
            localStorage.setItem("genera_user", JSON.stringify(loginResult.user))
            const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
            const secureAttr = isHttps ? '; Secure' : ''
            document.cookie = `auth-token=${loginResult.token}; path=/; max-age=${60 * 60 * 24}; SameSite=Strict${secureAttr}`
          }
          router.push("/dashboard")
          setIsLoading(false)
        } catch (e) {
          setError("No se pudo completar el inicio de sesión.")
          setIsLoading(false)
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
              Géner.A
            </CardTitle>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-600 to-purple-700 mx-auto mb-4 rounded-full"></div>
            <CardDescription className="text-gray-600">
              Ingrese sus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Verificación de seguridad</Label>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                  onChange={handleCaptchaChange}
                  theme="light"
                  size="normal"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading || !captchaVerified}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>
            
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                ¿Olvidó su contraseña?{" "}
                <a
                  href="/forgot-password"
                  className="text-purple-600 hover:text-purple-700 font-medium underline"
                >
                  Solicitar nueva contraseña
                </a>
              </p>
              <p className="text-sm text-gray-600">
                ¿No tiene una cuenta?{" "}
                <a
                  href="/register"
                  className="text-purple-600 hover:text-purple-700 font-medium underline"
                >
                  Solicitar acceso
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <NavigationButtons previousPage={{ href: "/", label: "Página Principal" }} showHome={false} />
      </div>
    </div>
  )
}
