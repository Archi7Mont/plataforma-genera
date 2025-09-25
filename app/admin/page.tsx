"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { NavigationButtons } from "@/components/navigation-buttons"
import { Key } from "lucide-react"
import { generateAndSavePassword, getStoredPasswordHashes, deletePasswordHash } from "@/lib/passwordStorage"
import { checkLocalStorageHealth } from "@/utils/passwordUtils"

interface User {
  id: string
  email: string
  status: "pending" | "approved" | "rejected" | "blocked" | "deleted"
  loginTime: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  blockedBy?: string
  blockedAt?: string
  unblockedBy?: string
  unblockedAt?: string
  deletedBy?: string
  deletedAt?: string
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [passwords, setPasswords] = useState<any[]>([])
  const [generatedPassword, setGeneratedPassword] = useState<{email: string, password: string} | null>(null)
  const [storageHealth, setStorageHealth] = useState<any>(null)
  const [securityDashboard, setSecurityDashboard] = useState<any>(null)
  const [loginAttempts, setLoginAttempts] = useState<any[]>([])
  const [securityEvents, setSecurityEvents] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'security' | 'passwords'>('users')
  const router = useRouter()

  useEffect(() => {
    const verifyAuth = async () => {
      if (typeof window === 'undefined') return

      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const result = await response.json()
        if (!result.success) {
          localStorage.removeItem("auth_token")
          localStorage.removeItem("genera_user")
          router.push("/login")
          return
        }

        if (!result.user.isAdmin) {
          router.push("/dashboard")
          return
        }

        const userData = localStorage.getItem("genera_user")
        if (userData) {
          const user = JSON.parse(userData)
          setCurrentUser(user)
          setIsAdmin(true)
        }
      } catch (error) {
        console.error('Auth verification failed:', error)
        localStorage.removeItem("auth_token")
        localStorage.removeItem("genera_user")
        router.push("/login")
      }
    }

    verifyAuth()
  }, [router])

  useEffect(() => {
    loadUsers()
    loadPasswords()
    checkStorageHealth()
    loadSecurityDashboard()
    loadLoginAttempts()
    loadSecurityEvents()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadPasswords = () => {
    setPasswords(getStoredPasswordHashes())
  }

  const checkStorageHealth = () => {
    const health = checkLocalStorageHealth()
    setStorageHealth(health)
    console.log('Storage Health Check:', health)
  }

  const loadSecurityDashboard = async () => {
    try {
      const response = await fetch('/api/security/dashboard?type=overview')
      const data = await response.json()
      if (data.success) {
        setSecurityDashboard(data.data)
      }
    } catch (error) {
      console.error('Error loading security dashboard:', error)
    }
  }

  const loadLoginAttempts = async () => {
    try {
      const response = await fetch('/api/security/dashboard?type=login-attempts&limit=20')
      const data = await response.json()
      if (data.success) {
        setLoginAttempts(data.data)
      }
    } catch (error) {
      console.error('Error loading login attempts:', error)
    }
  }

  const loadSecurityEvents = async () => {
    try {
      const response = await fetch('/api/security/dashboard?type=security-events&limit=20')
      const data = await response.json()
      if (data.success) {
        setSecurityEvents(data.data)
      }
    } catch (error) {
      console.error('Error loading security events:', error)
    }
  }

  const generatePasswordForUser = async (email: string) => {
    try {
      const password = await generateAndSavePassword(email, currentUser?.email || 'admin', true)
      loadPasswords()
      setGeneratedPassword({ email, password })
    } catch (error) {
      console.error('Error generating password:', error)
    }
  }

  const deletePassword = (email: string) => {
    deletePasswordHash(email)
    loadPasswords()
  }

  const approveUser = async (userId: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          userId,
          approvedBy: currentUser?.email || 'admin'
        })
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error approving user:', error)
    }
  }

  const rejectUser = async (userId: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          userId,
          rejectedBy: currentUser?.email || 'admin'
        })
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error rejecting user:', error)
    }
  }

  const blockUser = async (userId: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'block',
          userId,
          blockedBy: currentUser?.email || 'admin'
        })
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error blocking user:', error)
    }
  }

  const unblockUser = async (userId: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unblock',
          userId,
          unblockedBy: currentUser?.email || 'admin'
        })
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error unblocking user:', error)
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          userId,
          deletedBy: currentUser?.email || 'admin'
        })
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("genera_user")
    }
    router.push("/")
  }

  if (!currentUser || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">Cargando panel de administración...</div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
              Panel de Administración - Géner.A
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Bienvenido, {currentUser.email}
              </span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Generación de Contraseñas</CardTitle>
              <CardDescription>Genere nuevas contraseñas para usuarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={() => generatePasswordForUser('admin@genera.com')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Key className="w-4 h-4 mr-1" />
                  Generar Contraseña Admin
                </Button>
              </div>

              {generatedPassword && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                  <p className="font-semibold">Nueva contraseña generada para {generatedPassword.email}:</p>
                  <p className="font-mono text-lg mt-2">{generatedPassword.password}</p>
                </div>
              )}

              {passwords.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Contraseñas Generadas</h3>
                  {passwords.map((passwordInfo) => (
                    <div key={passwordInfo.email} className="flex items-center justify-between p-2 bg-gray-100 rounded mb-2">
                      <span>{passwordInfo.email}</span>
                      <span className="font-mono text-sm">{passwordInfo.plainPassword || 'Contraseña no disponible'}</span>
                      <Button onClick={() => deletePassword(passwordInfo.email)} variant="outline" size="sm">
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Gestión de Usuarios
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'security'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monitoreo de Seguridad
            </button>
            <button
              onClick={() => setActiveTab('passwords')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'passwords'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Contraseñas
            </button>
          </div>
        </div>

        {/* Users Management Tab */}
        {activeTab === 'users' && (
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>Administre usuarios registrados, contraseñas y permisos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Pending Users */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Usuarios Pendientes de Aprobación</h3>
                {users.filter(user => user.status === 'pending').length > 0 ? (
                  <div className="space-y-3">
                    {users.filter(user => user.status === 'pending').map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user.email}</p>
                          <p className="text-sm text-gray-600">Registrado: {new Date(user.loginTime).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => approveUser(user.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            Aprobar
                          </Button>
                          <Button
                            onClick={() => rejectUser(user.id)}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            size="sm"
                          >
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay usuarios pendientes</p>
                )}
              </div>

              {/* Approved Users */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Usuarios Aprobados</h3>
                {users.filter(user => user.status === 'approved').length > 0 ? (
                  <div className="space-y-3">
                    {users.filter(user => user.status === 'approved').map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user.email}</p>
                          <p className="text-sm text-gray-600">
                            Aprobado por: {user.approvedBy} el {new Date(user.approvedAt || '').toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => generatePasswordForUser(user.email)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            size="sm"
                          >
                            Generar Contraseña
                          </Button>
                          <Button
                            onClick={() => blockUser(user.id)}
                            variant="outline"
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                            size="sm"
                          >
                            Bloquear
                          </Button>
                          <Button
                            onClick={() => deleteUser(user.id)}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            size="sm"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay usuarios aprobados</p>
                )}
              </div>

              {/* Blocked Users */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Usuarios Bloqueados</h3>
                {users.filter(user => user.status === 'blocked').length > 0 ? (
                  <div className="space-y-3">
                    {users.filter(user => user.status === 'blocked').map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user.email}</p>
                          <p className="text-sm text-gray-600">
                            Bloqueado por: {user.blockedBy} el {new Date(user.blockedAt || '').toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => unblockUser(user.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            Desbloquear
                          </Button>
                          <Button
                            onClick={() => deleteUser(user.id)}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            size="sm"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay usuarios bloqueados</p>
                )}
              </div>

              {/* Rejected Users */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Usuarios Rechazados</h3>
                {users.filter(user => user.status === 'rejected').length > 0 ? (
                  <div className="space-y-3">
                    {users.filter(user => user.status === 'rejected').map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user.email}</p>
                          <p className="text-sm text-gray-600">
                            Rechazado por: {user.rejectedBy} el {new Date(user.rejectedAt || '').toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => approveUser(user.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            Aprobar
                          </Button>
                          <Button
                            onClick={() => deleteUser(user.id)}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            size="sm"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay usuarios rechazados</p>
                )}
              </div>

              {/* Deleted Users */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Usuarios Eliminados</h3>
                {users.filter(user => user.status === 'deleted').length > 0 ? (
                  <div className="space-y-3">
                    {users.filter(user => user.status === 'deleted').map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-gray-100 border border-gray-300 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-500 line-through">{user.email}</p>
                          <p className="text-sm text-gray-500">
                            Eliminado por: {user.deletedBy} el {new Date(user.deletedAt || '').toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          Usuario eliminado
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay usuarios eliminados</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Security Monitoring Tab */}
        {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security Overview */}
          {securityDashboard && (
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Resumen de Seguridad</CardTitle>
                <CardDescription>Métricas de seguridad en tiempo real</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-2xl font-bold text-blue-600">{securityDashboard.totalUsers}</h3>
                    <p className="text-sm text-blue-800">Total Usuarios</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-2xl font-bold text-yellow-600">{securityDashboard.pendingUsers}</h3>
                    <p className="text-sm text-yellow-800">Pendientes</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="text-2xl font-bold text-red-600">{securityDashboard.failedLoginAttempts}</h3>
                    <p className="text-sm text-red-800">Intentos Fallidos (24h)</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="text-2xl font-bold text-orange-600">{securityDashboard.securityEvents}</h3>
                    <p className="text-sm text-orange-800">Eventos de Seguridad</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Login Attempts */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Intentos de Inicio de Sesión Recientes</CardTitle>
              <CardDescription>Últimos 20 intentos de autenticación</CardDescription>
            </CardHeader>
            <CardContent>
              {loginAttempts.length > 0 ? (
                <div className="space-y-2">
                  {loginAttempts.map((attempt) => (
                    <div key={attempt.id} className={`p-3 rounded-lg border ${
                      attempt.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{attempt.email}</p>
                          <p className="text-sm text-gray-600">
                            {attempt.success ? 'Éxito' : `Fallido: ${attempt.failureReason}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            IP: {attempt.ipAddress} • {new Date(attempt.attemptedAt).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          attempt.success 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {attempt.success ? 'Éxito' : 'Fallido'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay intentos de inicio de sesión registrados</p>
              )}
            </CardContent>
          </Card>

          {/* Security Events */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Eventos de Seguridad</CardTitle>
              <CardDescription>Actividad de seguridad del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {securityEvents.length > 0 ? (
                <div className="space-y-2">
                  {securityEvents.map((event) => (
                    <div key={event.id} className={`p-3 rounded-lg border ${
                      event.level === 'critical' ? 'bg-red-50 border-red-200' :
                      event.level === 'error' ? 'bg-red-50 border-red-200' :
                      event.level === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{event.message}</p>
                          <p className="text-sm text-gray-600">
                            {event.type} • {event.level}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          event.level === 'critical' ? 'bg-red-100 text-red-800' :
                          event.level === 'error' ? 'bg-red-100 text-red-800' :
                          event.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {event.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay eventos de seguridad registrados</p>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {/* Passwords Tab */}
        {activeTab === 'passwords' && (
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle>Gestión de Contraseñas</CardTitle>
            <CardDescription>Contraseñas generadas para usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            {passwords.length > 0 ? (
              <div className="space-y-3">
                {passwords.map((passwordInfo) => (
                  <div key={passwordInfo.email} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{passwordInfo.email}</p>
                      <p className="text-sm text-gray-600">
                        Generada: {new Date(passwordInfo.generatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm bg-white px-3 py-1 rounded border">
                        {passwordInfo.plainPassword || 'Contraseña no disponible'}
                      </span>
                      <Button 
                        onClick={() => deletePassword(passwordInfo.email)} 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay contraseñas generadas</p>
            )}
          </CardContent>
        </Card>
        )}

        <NavigationButtons previousPage={{ href: "/dashboard", label: "Dashboard" }} />
      </main>
    </div>
  )
}