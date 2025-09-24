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

        <NavigationButtons previousPage={{ href: "/dashboard", label: "Dashboard" }} />
      </main>
    </div>
  )
}