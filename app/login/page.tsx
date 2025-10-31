"use client"

import { useState, useRef, FormEvent } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!email || !password) {
      setError("Por favor complete todos los campos")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || "Error de autenticación")
        setIsLoading(false)
        return
      }

      // Store token and user data
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("genera_user", JSON.stringify(data.user))
        
        // Set cookie
        const isHttps = window.location.protocol === "https:"
        const secureAttr = isHttps ? "; Secure" : ""
        document.cookie = `auth-token=${data.token}; path=/; max-age=${60 * 60 * 24}; SameSite=Strict${secureAttr}`
      }

      setSuccess("Inicio de sesión exitoso. Redirigiendo...")
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (error) {
      setError("Error en la verificación. Intente nuevamente.")
      setIsLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Géner.A</h1>
          <div style={styles.divider}></div>
          <p style={styles.subtitle}>Ingrese sus credenciales para acceder al sistema</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              <p style={styles.errorText}>{error}</p>
            </div>
          )}

          {success && (
            <div style={styles.successBox}>
              <p style={styles.successText}>{success}</p>
            </div>
          )}

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            disabled={isLoading}
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            ¿Olvidó su contraseña?{" "}
            <a href="/forgot-password" style={styles.link}>
              Solicitar nueva contraseña
            </a>
          </p>
          <p style={styles.footerText}>
            ¿No tiene una cuenta?{" "}
            <a href="/register" style={styles.link}>
              Solicitar acceso
            </a>
          </p>
        </div>
      </div>

      <a href="/" style={styles.homeButton}>
        ← Página Principal
      </a>
    </div>
  )
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom right, #f0f9ff, #f3e8ff)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  card: {
    width: "100%",
    maxWidth: "28rem",
    background: "white",
    borderRadius: "0.75rem",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    border: "none",
    overflow: "hidden",
  },
  header: {
    textAlign: "center" as const,
    padding: "2rem",
    borderBottom: "1px solid #f0f0f0",
  },
  title: {
    fontSize: "1.875rem",
    fontWeight: "bold",
    background: "linear-gradient(to right, #a855f7, #9333ea)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "1rem",
  },
  divider: {
    width: "4rem",
    height: "0.25rem",
    background: "linear-gradient(to right, #a855f7, #9333ea)",
    margin: "0 auto 1rem",
    borderRadius: "9999px",
  },
  subtitle: {
    color: "#4b5563",
    fontSize: "0.875rem",
  },
  form: {
    padding: "2rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#1f2937",
  },
  input: {
    padding: "0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "0.375rem",
    fontSize: "1rem",
    fontFamily: "inherit",
    transition: "all 0.2s",
  },
  errorBox: {
    padding: "0.75rem",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "0.375rem",
  },
  errorText: {
    color: "#991b1b",
    fontSize: "0.875rem",
    margin: 0,
  },
  successBox: {
    padding: "0.75rem",
    background: "#dcfce7",
    border: "1px solid #86efac",
    borderRadius: "0.375rem",
  },
  successText: {
    color: "#15803d",
    fontSize: "0.875rem",
    margin: 0,
  },
  button: {
    padding: "0.75rem",
    background: "linear-gradient(to right, #a855f7, #9333ea)",
    color: "white",
    border: "none",
    borderRadius: "0.75rem",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  footer: {
    padding: "1.5rem 2rem",
    textAlign: "center" as const,
    borderTop: "1px solid #f0f0f0",
  },
  footerText: {
    fontSize: "0.875rem",
    color: "#4b5563",
    margin: "0.5rem 0",
  },
  link: {
    color: "#a855f7",
    textDecoration: "underline",
    cursor: "pointer",
  },
  homeButton: {
    marginTop: "1.5rem",
    padding: "0.5rem 1rem",
    border: "1px solid #d1d5db",
    borderRadius: "0.375rem",
    textDecoration: "none",
    color: "#4b5563",
    transition: "all 0.2s",
  },
}
