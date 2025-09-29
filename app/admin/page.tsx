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
  const [activeTab, setActiveTab] = useState<'users' | 'security' | 'passwords' | 'questions'>('users')
  const [questions, setQuestions] = useState<any[]>([])
  const [passwordVisibility, setPasswordVisibility] = useState<{[email: string]: boolean}>({})
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

        console.log('Admin panel - Auth successful, setting user and admin status')
        setCurrentUser(result.user)
        setIsAdmin(true)
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
    console.log('Admin panel - useEffect triggered, loading data...')
    loadUsers()
    loadPasswords()
    loadPasswordResetRequests()
    checkStorageHealth()
    loadSecurityDashboard()
    loadLoginAttempts()
    loadSecurityEvents()
    loadQuestions()
  }, [])

  const loadUsers = async () => {
    try {
      console.log('Loading users from API...')
      const token = localStorage.getItem('auth_token')
      let response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      // If token expired, try to refresh
      if (response.status === 401) {
        console.log('Token expired, refreshing...')
        const newToken = await refreshToken()
        if (newToken) {
          response = await fetch('/api/users', {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          })
        }
      }

      const data = await response.json()
      console.log('API Response:', data)
      console.log('Response type:', typeof data)
      console.log('Response keys:', data ? Object.keys(data) : 'null')

      // Handle both direct array response and { users: [...] } response
      let usersArray = []
      if (Array.isArray(data)) {
        usersArray = data
        console.log('Response is direct array with', usersArray.length, 'users')
      } else if (data && Array.isArray(data.users)) {
        usersArray = data.users
        console.log('Response has users array with', usersArray.length, 'users')
      } else {
        console.log('No users array in response, data:', data)
        usersArray = []
      }

      // Debug pending users specifically
      const pendingUsers = usersArray.filter((user: any) => user.status === 'pending')
      console.log('Pending users found:', pendingUsers.length)
      console.log('Pending users:', pendingUsers.map((u: any) => ({ email: u.email, fullName: u.fullName, status: u.status })))

      setUsers(usersArray)
      console.log('Users loaded:', usersArray.length)
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
    }
  }

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@genera.com', password: 'Admin1234!' })
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
      console.log('Approving user:', userId, 'by:', currentUser?.email, 'Type:', typeof userId)
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
          action: 'approve',
          userId,
          approvedBy: currentUser?.email || 'admin'
        })
      })
      const data = await response.json()
      console.log('Approval response:', data)
      if (data.success) {
        setUsers(data.users)
        console.log('User approved successfully')
        // Refresh all data after approval
        loadUsers()
        loadPasswords()
      } else {
        console.error('Approval failed:', data.error)
        alert('Error approving user: ' + data.error)
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
                console.log('Current users state:', users)
                console.log('Pending users in state:', users?.filter(u => u.status === 'pending'))
                alert(`Total users: ${users?.length || 0}, Pending: ${users?.filter(u => u.status === 'pending').length || 0}`)
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
                <strong> Pendientes:</strong> {Array.isArray(users) ? users.filter(u => u.status === 'pending').length : 0} | 
                <strong> Aprobados:</strong> {Array.isArray(users) ? users.filter(u => u.status === 'approved').length : 0}
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
                {users && Array.isArray(users) && users.filter((user: any) => user.status === 'pending').length > 0 ? (
                  <div className="space-y-3">
                    {users && Array.isArray(users) && users.filter((user: any) => user.status === 'pending').map((user: any) => (
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
                {users && Array.isArray(users) && users.filter((user: any) => user.status === 'approved').length > 0 ? (
                  <div className="space-y-4">
                    {users && Array.isArray(users) && users.filter((user: any) => user.status === 'approved').map((user: any) => {
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
                                      {passwordState.status === 'no_password' && (
                                        <Badge variant="outline" className="text-gray-600">Sin contraseña</Badge>
                                      )}
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
                {users && Array.isArray(users) && users.filter((user: any) => user.status === 'blocked').length > 0 ? (
                  <div className="space-y-3">
                    {users && Array.isArray(users) && users.filter((user: any) => user.status === 'blocked').map((user: any) => (
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
                {users && Array.isArray(users) && users.filter((user: any) => user.status === 'rejected').length > 0 ? (
                  <div className="space-y-3">
                    {users && Array.isArray(users) && users.filter((user: any) => user.status === 'rejected').map((user: any) => (
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
                {users && Array.isArray(users) && users.filter((user: any) => user.status === 'deleted').length > 0 ? (
                  <div className="space-y-3">
                    {users && Array.isArray(users) && users.filter((user: any) => user.status === 'deleted').map((user: any) => (
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
        {/* Password generation card moved below user management per request */}
        <div className="mt-8">
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
            </CardContent>
          </Card>
        </div>

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
              {loginAttempts && Array.isArray(loginAttempts) && loginAttempts.length > 0 ? (
                <div className="space-y-2">
                  {loginAttempts && Array.isArray(loginAttempts) && loginAttempts.map((attempt) => (
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
              {securityEvents && Array.isArray(securityEvents) && securityEvents.length > 0 ? (
                <div className="space-y-2">
                  {securityEvents && Array.isArray(securityEvents) && securityEvents.map((event) => (
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
            {/* Password reset requests */}
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2 text-gray-800">Solicitudes de Restablecimiento</h3>
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

            {passwords && Array.isArray(passwords) && passwords.length > 0 ? (
              <div className="space-y-3">
                {passwords && Array.isArray(passwords) && passwords.map((passwordInfo) => (
                  <div key={passwordInfo.email} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{passwordInfo.email}</p>
                      <p className="text-sm text-gray-600">
                        Generada: {passwordInfo.generatedAt ? new Date(passwordInfo.generatedAt as string).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-white px-3 py-1 rounded border">
                          {passwordVisibility[passwordInfo.email] 
                            ? (passwordInfo.plainPassword || passwordInfo.password || 'Contraseña no disponible')
                            : '••••••••'
                          }
                        </span>
                        <Button
                          onClick={() => togglePasswordVisibility(passwordInfo.email)}
                          variant="outline"
                          size="sm"
                          className="p-2"
                        >
                          {passwordVisibility[passwordInfo.email] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button 
                        onClick={() => resetPassword(passwordInfo.email)} 
                        variant="outline" 
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
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

        <NavigationButtons previousPage={{ href: "/dashboard", label: "Dashboard" }} />
      </main>
    </div>
  )
}