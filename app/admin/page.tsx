"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { NavigationButtons } from "@/components/navigation-buttons"
import { Key, Eye, EyeOff, RotateCcw } from "lucide-react"
// Password management is now handled via API endpoints
import { checkLocalStorageHealth } from "@/utils/passwordUtils"

interface User {
  id: string
  email: string
  fullName: string
  organization: string
  position: string | null
  status: "PENDING" | "APPROVED" | "REJECTED" | "BLOCKED" | "DELETED"
  role: "ADMIN" | "USER"
  passwordHash: string | null
  createdAt: string
  lastLoginAt: string | null
  loginCount: number
  isActive: boolean
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  blockedBy: string | null
  blockedAt: string | null
  unblockedBy: string | null
  unblockedAt: string | null
  deletedBy: string | null
  deletedAt: string | null
  requestedIndexAccess: string | null
}

interface PasswordState {
  email: string
  status: 'pending_approval' | 'active'
  password: string
  plainPassword: string
  generatedAt: string
  approvedAt: string | null
  approvedBy: string | null
  revokedAt: string | null
  revokedBy: string | null
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [passwords, setPasswords] = useState<PasswordState[]>([])
  const [passwordResetRequests, setPasswordResetRequests] = useState<any[]>([])
  const [generatedPassword, setGeneratedPassword] = useState<{email: string, password: string} | null>(null)
  const [storageHealth, setStorageHealth] = useState<any>(null)
  const [securityDashboard, setSecurityDashboard] = useState<any>(null)
  const [loginAttempts, setLoginAttempts] = useState<any[]>([])
  const [securityEvents, setSecurityEvents] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'security' | 'passwords' | 'questions' | 'generated-passwords'>('users')
  const [questions, setQuestions] = useState<any[]>([])
  const [passwordVisibility, setPasswordVisibility] = useState<{[email: string]: boolean}>({})
  const [generatedPasswordHistory, setGeneratedPasswordHistory] = useState<any[]>([])
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null)
  const router = useRouter()


  useEffect(() => {
    // Get user from localStorage (set during login)
    const userStr = localStorage.getItem("genera_user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
        setIsAdmin(user.isAdmin === true)
      } catch (e) {
        console.error('Failed to parse user:', e)
      }
    }
    
    // Middleware already verified auth, just load data
    loadUsers()
    loadPasswords()
    loadPasswordResetRequests()
    loadSecurityDashboard()
    loadLoginAttempts()
    loadSecurityEvents()
    loadQuestions()
    loadPasswordHistory()
  }, [])

  const loadUsers = async () => {
    try {
      console.log('Loading users...')
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/users/manage', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      if (data && Array.isArray(data.users)) {
        setUsers(data.users)
        console.log('Loaded', data.users.length, 'users')
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Align with fallback admin password ("admin123")
        body: JSON.stringify({ email: 'admin@genera.com', password: 'admin123' })
      })
      const result = await response.json()
      if (result.success && result.token) {
        localStorage.setItem('auth_token', result.token)
        return result.token
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
    }
    return null
  }

  const loadPasswords = async () => {
    try {
      let token = localStorage.getItem('auth_token')
      if (!token) {
        setPasswords([])
        return
      }

      let response = await fetch('/api/users/passwords', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // If token expired, try to refresh
      if (response.status === 401) {
        console.log('Token expired, refreshing...')
        token = await refreshToken()
        if (token) {
          response = await fetch('/api/users/passwords', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        }
      }

      const data = await response.json()

      if (data && data.success && Array.isArray(data.passwords)) {
        // API already returns PasswordState format
        setPasswords(data.passwords)
      } else {
        setPasswords([])
      }
    } catch (error) {
      console.error('Error loading passwords:', error)
      setPasswords([])
    }
  }

  const approvePassword = async (email: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Authentication required')
        return
      }

      const response = await fetch('/api/users/passwords/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, approvedBy: currentUser?.email || 'admin' })
      })
      const data = await response.json()
      if (data.success) {
        // Refresh all data after password approval
        loadUsers()
        loadPasswords()
      }
    } catch (error) {
      console.error('Error approving password:', error)
    }
  }

  const rejectPassword = async (email: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Authentication required')
        return
      }

      const response = await fetch('/api/users/passwords/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, rejectedBy: currentUser?.email || 'admin' })
      })
      const data = await response.json()
      if (data.success) {
        // Refresh all data after password rejection
        loadUsers()
        loadPasswords()
      }
    } catch (error) {
      console.error('Error rejecting password:', error)
    }
  }

  const revokePassword = async (email: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Authentication required')
        return
      }

      const response = await fetch('/api/users/passwords/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, revokedBy: currentUser?.email || 'admin' })
      })
      const data = await response.json()
      if (data.success) {
        // Refresh all data after password revocation
        loadUsers()
        loadPasswords()
      }
    } catch (error) {
      console.error('Error revoking password:', error)
    }
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

  const loadQuestions = async () => {
    try {
      const res = await fetch('/api/questions')
      const data = await res.json()
      if (data && data.success) {
        setQuestions(Array.isArray(data.questions) ? data.questions : [])
      }
    } catch {}
  }

  const loadPasswordHistory = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setGeneratedPasswordHistory([])
        return
      }

      const response = await fetch('/api/users/manage?action=password-history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success && Array.isArray(data.history)) {
        setGeneratedPasswordHistory(data.history)
      } else {
        setGeneratedPasswordHistory([])
      }
    } catch (error) {
      console.error('Error loading password history:', error)
      setGeneratedPasswordHistory([])
    }
  }

  const generatePasswordForUser = async (email: string) => {
    try {
      console.log('Generating password for email:', email)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Authentication required')
        return
      }

      const response = await fetch('/api/users/generate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedPassword({ email: result.email, password: result.password })
        // Refresh all data after password generation
        loadUsers()
        loadPasswords()
        loadPasswordHistory()
        alert(`Password generated for ${email}: ${result.password}`)
      } else {
        console.error('Error generating password:', result.error)
        alert('Error generating password: ' + result.error)
      }
    } catch (error) {
      console.error('Error generating password:', error)
      alert('Error generating password: ' + (error as Error).message)
    }
  }

  const deletePassword = (email: string) => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      alert('Authentication required')
      return
    }

    fetch('/api/users/passwords', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email })
    })
      .then(res => res.json())
      .then(() => {
        // Refresh all data after password deletion
        loadUsers()
        loadPasswords()
      })
      .catch(() => {
        // Refresh all data even on error
        loadUsers()
        loadPasswords()
      })
  }

  const resetPassword = async (email: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Authentication required')
        return
      }

      // First delete the existing password
      await fetch('/api/users/passwords', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      })

      // Then generate a new password
      const response = await fetch('/api/users/generate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      })

      const result = await response.json()
      if (result.success) {
        alert(`Nueva contraseña generada para ${email}: ${result.password}`)
        // Refresh all data after password reset
        loadUsers()
        loadPasswords()
      } else {
        alert('Error generando nueva contraseña: ' + result.error)
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Error reseteando contraseña: ' + (error as Error).message)
    }
  }

  const togglePasswordVisibility = (email: string) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [email]: !prev[email]
    }))
  }

  const loadPasswordResetRequests = async () => {
    try {
      const res = await fetch('/api/users/password-reset-request')
      const data = await res.json()
      if (data && data.success) {
        setPasswordResetRequests(Array.isArray(data.requests) ? data.requests : [])
      }
    } catch {}
  }

  const approveUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Authentication required')
        return
      }

      const response = await fetch('/api/users/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'approve',
          userId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert(`✅ Usuario aprobado exitosamente!`)
        loadUsers()
        loadPasswordHistory()
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error approving user:', error)
      alert('Error approving user: ' + (error as Error).message)
    }
  }

  const rejectUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Authentication required')
        return
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'reject',
          userId,
          rejectedBy: currentUser?.email || 'admin'
        })
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
        // Refresh all data after rejection
        loadUsers()
        loadPasswords()
      } else {
        alert('Error rejecting user: ' + data.error)
      }
    } catch (error) {
      console.error('Error rejecting user:', error)
      alert('Error rejecting user: ' + (error as Error).message)
    }
  }

  const blockUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Authentication required')
        return
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'block',
          userId,
          blockedBy: currentUser?.email || 'admin'
        })
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
        // Refresh all data after blocking
        loadUsers()
        loadPasswords()
      } else {
        alert('Error blocking user: ' + data.error)
      }
    } catch (error) {
      console.error('Error blocking user:', error)
      alert('Error blocking user: ' + (error as Error).message)
    }
  }

  const unblockUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Authentication required')
        return
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'unblock',
          userId,
          unblockedBy: currentUser?.email || 'admin'
        })
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      } else {
        alert('Error unblocking user: ' + data.error)
      }
    } catch (error) {
      console.error('Error unblocking user:', error)
      alert('Error unblocking user: ' + (error as Error).message)
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Authentication required')
        return
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'delete',
          userId,
          deletedBy: currentUser?.email || 'admin'
        })
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      } else {
        alert('Error deleting user: ' + data.error)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user: ' + (error as Error).message)
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
        

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
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
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'questions'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Preguntas Usuarios
              </button>
              <button
                onClick={() => setActiveTab('generated-passwords')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'generated-passwords'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Contraseñas Generadas
              </button>
            </div>
            <Button
              onClick={() => {
                loadUsers()
                loadSecurityDashboard()
                loadLoginAttempts()
                loadSecurityEvents()
              }}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:bg-blue-50"
            >
              🔄 Actualizar
            </Button>
            <Button
              onClick={() => {
                // Use correct status value casing: "PENDING" instead of "pending"
                console.log('Current users state:', users)
                console.log('Pending users in state:', users?.filter(u => u.status === 'PENDING'))
                alert(`Total users: ${users?.length || 0}, Pending: ${users?.filter(u => u.status === 'PENDING').length || 0}`)
              }}
              variant="outline"
              size="sm"
              className="text-green-600 hover:bg-green-50 ml-2"
            >
              🐛 Debug
            </Button>
          </div>
        </div>

        {/* Users Management Tab */}
        {activeTab === 'users' && (
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>Administre usuarios registrados, contraseñas y permisos</CardDescription>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Total usuarios:</strong> {Array.isArray(users) ? users.length : 0} | 
                <strong> Pendientes:</strong> {Array.isArray(users) ? users.filter(u => u.status === 'PENDING').length : 0} |
                <strong> Aprobados:</strong> {Array.isArray(users) ? users.filter(u => u.status === 'APPROVED').length : 0}
              </p>
              <div className="mt-2">
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/test-users')
                      const data = await response.json()
                      console.log('Test API Response:', data)
                      alert(`Test API: ${data.count} users found. Check console for details.`)
                    } catch (error) {
                      console.error('Test API Error:', error)
                      alert('Test API Error: ' + (error as Error).message)
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  🧪 Test API
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Pending Users */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Usuarios Pendientes de Aprobación</h3>
                {users && Array.isArray(users) && users.filter((user: any) => user.status === 'PENDING').length > 0 ? (
                  <div className="space-y-3">
                    {users && Array.isArray(users) && users.filter((user: any) => user.status === 'PENDING').map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-gray-900">{user.email}</p>
                            <Badge variant="outline" className="text-yellow-600">Pendiente</Badge>
                          </div>
                          <p className="text-sm text-gray-700">Nombre y Apellido: {user.fullName || '—'}</p>
                          <p className="text-sm text-gray-700">Entidad Fiscalizadora: {user.organization || '—'}</p>
                          <p className="text-sm text-gray-700">Acceso solicitado: {user.requestedIndexAccess || 'General'}</p>
                          <p className="text-xs text-gray-500">Registrado: {new Date(user.createdAt).toLocaleDateString()}</p>
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
                            onClick={() => blockUser(user.id)}
                            variant="outline"
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                            size="sm"
                          >
                            Bloquear
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

              {/* Approved Users with Password States */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Usuarios Aprobados</h3>
                {users && Array.isArray(users) && users.filter((user: any) => user.status === 'APPROVED').length > 0 ? (
                  <div className="space-y-4">
                    {users && Array.isArray(users) && users.filter((user: any) => user.status === 'APPROVED').map((user: any) => {
                      const passwordState = passwords.find(p => p.email === user.email)
                      return (
                        <div key={user.id} className="border border-green-200 rounded-lg overflow-hidden">
                          {/* User Info */}
                          <div className="flex items-center justify-between p-4 bg-green-50">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium text-gray-900">{user.email}</p>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">Aprobado</Badge>
                              </div>
                              <p className="text-sm text-gray-700">Nombre y Apellido: {user.fullName || '—'}</p>
                              <p className="text-sm text-gray-700">Entidad Fiscalizadora: {user.organization || '—'}</p>
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

                          {/* Password State */}
                          <div className="px-4 py-3 bg-white border-t border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  Estado de contraseña:
                                </p>
                                <div className="flex items-center gap-2">
                                  {passwordState ? (
                                    <>
                                      {passwordState.status === 'pending_approval' && (
                                        <Badge variant="outline" className="text-yellow-600">Pendiente de aprobación</Badge>
                                      )}
                                      {passwordState.status === 'active' && (
                                        <Badge variant="outline" className="text-green-600">Activa</Badge>
                                      )}
                                      <span className="text-xs text-gray-500">
                                        {passwordState.generatedAt && `Generada: ${new Date(passwordState.generatedAt).toLocaleDateString()}`}
                                      </span>
                                    </>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-600">Sin contraseña</Badge>
                                  )}
                                </div>
                              </div>
                              {passwordState && passwordState.status === 'pending_approval' && (
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => approvePassword(user.email)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    size="sm"
                                  >
                                    Aprobar
                                  </Button>
                                  <Button
                                    onClick={() => rejectPassword(user.email)}
                                    variant="outline"
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                    size="sm"
                                  >
                                    Rechazar
                                  </Button>
                                </div>
                              )}
                              {passwordState && passwordState.status === 'active' && (
                                <Button
                                  onClick={() => revokePassword(user.email)}
                                  variant="outline"
                                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                  size="sm"
                                >
                                  Revocar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay usuarios aprobados</p>
                )}
              </div>

              {/* Blocked Users */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Usuarios Bloqueados</h3>
                {users && Array.isArray(users) && users.filter((user: any) => user.status === 'BLOCKED').length > 0 ? (
                  <div className="space-y-3">
                    {users && Array.isArray(users) && users.filter((user: any) => user.status === 'BLOCKED').map((user: any) => (
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
                {users && Array.isArray(users) && users.filter((user: any) => user.status === 'REJECTED').length > 0 ? (
                  <div className="space-y-3">
                    {users && Array.isArray(users) && users.filter((user: any) => user.status === 'REJECTED').map((user: any) => (
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
                {users && Array.isArray(users) && users.filter((user: any) => user.status === 'DELETED').length > 0 ? (
                  <div className="space-y-3">
                    {users && Array.isArray(users) && users.filter((user: any) => user.status === 'DELETED').map((user: any) => (
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

        {/* Passwords Tab */}
        {activeTab === 'passwords' && (
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle>Gestión de Contraseñas</CardTitle>
            <CardDescription>Contraseñas generadas para usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Password reset requests */}
            <div className="mb-8">
              <h3 className="text-md font-semibold mb-4 text-gray-800">Solicitudes de Restablecimiento</h3>
              {passwordResetRequests && Array.isArray(passwordResetRequests) && passwordResetRequests.length > 0 ? (
                <div className="space-y-2">
                  {passwordResetRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex-1">
                        <p className="font-medium">{req.email}</p>
                        <p className="text-xs text-gray-600">Solicitado: {new Date(req.requestedAt).toLocaleString()}</p>
                      </div>
                      <Badge>{req.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sin solicitudes de restablecimiento</p>
              )}
            </div>

            {/* User Password Cards */}
            <div>
              <h3 className="text-md font-semibold mb-4 text-gray-800">Contraseñas de Usuarios</h3>
              {passwords && Array.isArray(passwords) && passwords.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {passwords && Array.isArray(passwords) && passwords.map((passwordInfo) => {
                    // Find the corresponding user to get more details
                    const user = users.find(u => u.email === passwordInfo.email)
                    return (
                      <div key={passwordInfo.email} className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                        {/* User Header */}
                        <div className="mb-4 pb-4 border-b border-purple-200">
                          <h4 className="font-semibold text-gray-900 text-lg">{user?.fullName || 'Usuario'}</h4>
                          <p className="text-sm text-gray-600">{passwordInfo.email}</p>
                        </div>

                        {/* Password Status Badge */}
                        <div className="mb-4">
                          {passwordInfo.status === 'pending_approval' && (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              Pendiente de Aprobación
                            </Badge>
                          )}
                          {passwordInfo.status === 'active' && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Activa
                            </Badge>
                          )}
                        </div>

                        {/* Password Display */}
                        <div className="mb-4">
                          <label className="text-xs font-medium text-gray-600 mb-2 block">Contraseña</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white border border-gray-300 rounded px-3 py-2">
                              <span className="font-mono text-sm">
                                {passwordVisibility[passwordInfo.email] 
                                  ? (passwordInfo.plainPassword || passwordInfo.password || '••••••••')
                                  : '••••••••'
                                }
                              </span>
                            </div>
                            <Button
                              onClick={() => togglePasswordVisibility(passwordInfo.email)}
                              variant="outline"
                              size="sm"
                              className="p-2 h-10 w-10"
                              title={passwordVisibility[passwordInfo.email] ? "Ocultar" : "Mostrar"}
                            >
                              {passwordVisibility[passwordInfo.email] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Password Info */}
                        <div className="mb-4 text-xs text-gray-600 space-y-1">
                          <p>Generada: {passwordInfo.generatedAt ? new Date(passwordInfo.generatedAt as string).toLocaleString() : 'N/A'}</p>
                          {passwordInfo.approvedAt && <p>Aprobada por: {passwordInfo.approvedBy}</p>}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            onClick={() => {
                              const passwordToCopy = passwordVisibility[passwordInfo.email] 
                                ? (passwordInfo.plainPassword || passwordInfo.password || '')
                                : (passwordInfo.plainPassword || passwordInfo.password || '')
                              if (passwordToCopy) {
                                navigator.clipboard.writeText(passwordToCopy)
                                setCopiedPassword(passwordInfo.email)
                                setTimeout(() => setCopiedPassword(null), 2000)
                              }
                            }} 
                            variant="outline" 
                            size="sm"
                            className="flex-1 text-purple-600 hover:bg-purple-100 border-purple-300"
                          >
                            {copiedPassword === passwordInfo.email ? '✓ Copiado' : 'Copiar'}
                          </Button>
                          <Button 
                            onClick={() => resetPassword(passwordInfo.email)} 
                            variant="outline" 
                            size="sm"
                            className="flex-1 text-blue-600 hover:bg-blue-100 border-blue-300"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Generar Nueva
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Key className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay contraseñas generadas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle>Preguntas de Usuarios</CardTitle>
            <CardDescription>Consultas recibidas desde la sección FAQ</CardDescription>
          </CardHeader>
          <CardContent>
            {questions && Array.isArray(questions) && questions.length > 0 ? (
              <div className="space-y-3">
                {questions.map((q) => (
                  <div key={q.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{q.userName} <span className="text-gray-500">({q.userEmail})</span></p>
                        <p className="text-sm text-gray-600">Entidad Fiscalizadora: {q.userEntity || '—'}</p>
                        <p className="text-sm text-gray-800 mt-2">{q.userQuestion}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(q.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay consultas de usuarios</p>
            )}
          </CardContent>
        </Card>
        )}

        {/* Generated Passwords Tab */}
        {activeTab === 'generated-passwords' && (
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Contraseñas Generadas Recientemente</CardTitle>
              <CardDescription>Lista de contraseñas generadas para usuarios</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedPasswordHistory && Array.isArray(generatedPasswordHistory) && generatedPasswordHistory.length > 0 ? (
                <div className="space-y-3">
                  {generatedPasswordHistory.map((pass) => (
                    <div key={pass.id} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{pass.email}</p>
                        <p className="text-sm text-gray-600">
                          Contraseña: <span className="font-mono text-sm bg-white px-2 py-1 rounded border">{pass.password}</span>
                        </p>
                        <p className="text-xs text-gray-500">Generada: {new Date(pass.generatedAt).toLocaleString()}</p>
                      </div>
                      <Button
                        onClick={() => {
                          setCopiedPassword(pass.password);
                          navigator.clipboard.writeText(pass.password);
                          setTimeout(() => setCopiedPassword(null), 2000);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-purple-600 hover:bg-purple-50"
                      >
                        {copiedPassword === pass.password ? 'Copiado!' : 'Copiar'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay contraseñas generadas recientemente</p>
              )}
            </CardContent>
          </Card>
        )}

        <NavigationButtons previousPage={{ href: "/dashboard", label: "Dashboard" }} />
      </main>
    </div>
  )
}