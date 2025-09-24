"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NavigationButtons } from "@/components/navigation-buttons"
import ReCAPTCHA from "react-google-recaptcha"
import { useRef } from "react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    organization: "",
    position: "",
    reason: ""
  })
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCaptchaChange = (value: string | null) => {
    setCaptchaVerified(!!value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!captchaVerified) {
      setError("Por favor complete la verificación reCAPTCHA")
      return
    }

    if (!formData.email || !formData.fullName || !formData.organization || !formData.reason) {
      setError("Por favor complete todos los campos obligatorios")
      return
    }

    setIsLoading(true)

    try {
      // Verify reCAPTCHA token with server
      const recaptchaToken = recaptchaRef.current?.getValue()
      
      if (!recaptchaToken) {
        setError("Error de verificación reCAPTCHA")
        setIsLoading(false)
        return
      }

      // Verify reCAPTCHA token with backend
      const verifyResponse = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: recaptchaToken }),
      })

      const verifyResult = await verifyResponse.json()
      
      if (!verifyResult.success) {
        setError("Verificación reCAPTCHA fallida. Intente nuevamente.")
        setIsLoading(false)
        return
      }

      // Check if user already exists
      const existingUsers = localStorage.getItem("genera_all_users")
      const users = existingUsers ? JSON.parse(existingUsers) : []
      
      const userExists = users.find((u: any) => u.email === formData.email)
      if (userExists) {
        setError("Ya existe una solicitud para este email. Contacte al administrador si no ha recibido respuesta.")
        setIsLoading(false)
        return
      }

      // Create new user request
      const newUser = {
        id: Date.now().toString(),
        email: formData.email,
        fullName: formData.fullName,
        organization: formData.organization,
        position: formData.position,
        reason: formData.reason,
        status: "pending",
        loginTime: new Date().toISOString(),
        requestedAt: new Date().toISOString()
      }

      // Save user request
      const updatedUsers = [...users, newUser]
      localStorage.setItem("genera_all_users", JSON.stringify(updatedUsers))

      setSuccess(true)
      setIsLoading(false)
      
      // Reset form
      setFormData({
        email: "",
        fullName: "",
        organization: "",
        position: "",
        reason: ""
      })
      
      // Reset reCAPTCHA
      recaptchaRef.current?.reset()
      setCaptchaVerified(false)

    } catch (error) {
      setError("Error al procesar la solicitud. Intente nuevamente.")
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">Solicitud Enviada</CardTitle>
            <CardDescription>
              Su solicitud de acceso ha sido enviada correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Próximos pasos:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Su solicitud será revisada por un administrador</li>
                  <li>• Recibirá un email con su contraseña una vez aprobada</li>
                  <li>• El proceso puede tomar 1-2 días hábiles</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button 
                onClick={() => setSuccess(false)}
                variant="outline" 
                className="flex-1"
              >
                Nueva Solicitud
              </Button>
              <Button 
                onClick={() => router.push("/login")}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Ir a Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800">Solicitar Acceso</CardTitle>
            <CardDescription className="text-gray-500">
              Complete el formulario para solicitar acceso al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="su@email.com"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  type="text"
                  name="fullName"
                  placeholder="Juan Pérez"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Entidad Fiscalizadora *</Label>
                <Input
                  id="organization"
                  type="text"
                  name="organization"
                  placeholder="Nombre de la entidad fiscalizadora"
                  required
                  value={formData.organization}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Cargo/Posición</Label>
                <Input
                  id="position"
                  type="text"
                  name="position"
                  placeholder="Analista, Coordinador, etc."
                  value={formData.position}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo de la Solicitud *</Label>
                <textarea
                  id="reason"
                  name="reason"
                  placeholder="Explique brevemente por qué necesita acceso al sistema..."
                  required
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all duration-200"
                  rows={3}
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
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-lg font-semibold transition-colors duration-200" 
                disabled={isLoading}
              >
                {isLoading ? "Enviando solicitud..." : "Enviar Solicitud"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <NavigationButtons />
      </div>
    </div>
  )
}
