"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NavigationButtons } from "@/components/navigation-buttons";
import ReCAPTCHA from "react-google-recaptcha";
import { useRef } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleCaptchaChange = (value: string | null) => {
    setCaptchaVerified(!!value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!captchaVerified) {
      setError("Por favor complete la verificación reCAPTCHA");
      return;
    }

    if (!email) {
      setError("Por favor ingrese su correo electrónico");
      return;
    }

    setIsLoading(true);

    try {
      // Verify reCAPTCHA token with server
      const recaptchaToken = recaptchaRef.current?.getValue();

      if (!recaptchaToken) {
        setError("Error de verificación reCAPTCHA");
        setIsLoading(false);
        return;
      }

      // Verify reCAPTCHA token with backend
      const verifyResponse = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: recaptchaToken }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success) {
        setError("Verificación reCAPTCHA fallida. Intente nuevamente.");
        setIsLoading(false);
        return;
      }

      // Check if user exists in system
      const existingUsers = localStorage.getItem("genera_all_users");
      const users = existingUsers ? JSON.parse(existingUsers) : [];

      const user = users.find((u: any) => u.email === email);

      if (!user) {
        setError("No se encontró una cuenta con este correo electrónico.");
        setIsLoading(false);
        return;
      }

      if (user.status === "pending") {
        setError("Su solicitud de registro aún está pendiente de aprobación.");
        setIsLoading(false);
        return;
      }

      if (user.status === "rejected") {
        setError("Su solicitud de acceso fue rechazada. Contacte al administrador.");
        setIsLoading(false);
        return;
      }

      if (user.status === "blocked") {
        setError("Su cuenta ha sido bloqueada. Contacte al administrador.");
        setIsLoading(false);
        return;
      }

      if (user.status === "deleted") {
        setError("Su cuenta ha sido eliminada. Contacte al administrador.");
        setIsLoading(false);
        return;
      }

      // Check if there's already a pending password reset request
      const existingRequests = localStorage.getItem("genera_password_reset_requests");
      const requests = existingRequests ? JSON.parse(existingRequests) : [];

      const existingRequest = requests.find((r: any) => r.email === email && r.status === "pending");

      if (existingRequest) {
        setError("Ya tiene una solicitud de restablecimiento de contraseña pendiente.");
        setIsLoading(false);
        return;
      }

      // Create password reset request
      const newRequest = {
        id: Date.now().toString(),
        email: email,
        requestedAt: new Date().toISOString(),
        status: "pending",
        userId: user.id
      };

      const updatedRequests = [...requests, newRequest];
      localStorage.setItem("genera_password_reset_requests", JSON.stringify(updatedRequests));

      setSuccess(true);
      setIsLoading(false);

      // Reset form
      setEmail("");
      recaptchaRef.current?.reset();
      setCaptchaVerified(false);

    } catch (error) {
      setError("Error al procesar la solicitud. Intente nuevamente.");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">Solicitud Enviada</CardTitle>
            <CardDescription>
              Su solicitud de restablecimiento de contraseña ha sido enviada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Próximos pasos:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Su solicitud será revisada por un administrador</li>
                  <li>• Recibirá una nueva contraseña por email una vez procesada</li>
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800">Restablecer Contraseña</CardTitle>
            <CardDescription className="text-gray-500">
              Ingrese su correo electrónico para solicitar una nueva contraseña
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="su@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {isLoading ? "Enviando solicitud..." : "Solicitar Nueva Contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <NavigationButtons />
      </div>
    </div>
  );
}

