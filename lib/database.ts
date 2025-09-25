// Enhanced database schema for comprehensive user and security management
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const LOGIN_ATTEMPTS_FILE = path.join(DATA_DIR, 'login_attempts.json')
const SYSTEM_LOGS_FILE = path.join(DATA_DIR, 'system_logs.json')

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Initialize default data if files don't exist
function initializeDefaultData() {
  ensureDataDir()
  
  // Initialize users file
  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = [
      {
        id: "1",
        email: "admin@genera.com",
        fullName: "Administrator",
        organization: "Géner.A System",
        position: "System Administrator",
        status: "approved",
        role: "admin",
        passwordHash: "admin123", // This should be properly hashed
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        loginCount: 0,
        isActive: true,
        approvedBy: "system",
        approvedAt: new Date().toISOString()
      },
      {
        id: "2",
        email: "usuario1@ejemplo.com",
        fullName: "Usuario Demo 1",
        organization: "Organización Demo",
        position: "Analista",
        status: "pending",
        role: "user",
        passwordHash: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        loginCount: 0,
        isActive: true,
        approvedBy: null,
        approvedAt: null
      }
    ]
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2))
  }

  // Initialize login attempts file
  if (!fs.existsSync(LOGIN_ATTEMPTS_FILE)) {
    fs.writeFileSync(LOGIN_ATTEMPTS_FILE, JSON.stringify([], null, 2))
  }

  // Initialize system logs file
  if (!fs.existsSync(SYSTEM_LOGS_FILE)) {
    fs.writeFileSync(SYSTEM_LOGS_FILE, JSON.stringify([], null, 2))
  }
}

// User Management Functions
export interface User {
  id: string
  email: string
  fullName: string
  organization: string
  position: string
  status: 'pending' | 'approved' | 'rejected' | 'blocked' | 'deleted'
  role: 'admin' | 'user'
  passwordHash: string | null
  createdAt: string
  lastLoginAt: string | null
  loginCount: number
  isActive: boolean
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy?: string | null
  rejectedAt?: string | null
  blockedBy?: string | null
  blockedAt?: string | null
  deletedBy?: string | null
  deletedAt?: string | null
}

export interface LoginAttempt {
  id: string
  email: string
  ipAddress: string
  userAgent: string
  success: boolean
  failureReason?: string
  attemptedAt: string
  userId?: string
}

export interface SystemLog {
  id: string
  type: 'user_action' | 'security_event' | 'system_event' | 'admin_action'
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  details: any
  userId?: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

// Initialize database on import
initializeDefaultData()

// User Functions
export function getAllUsers(): User[] {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading users:', error)
    return []
  }
}

export function getUserById(id: string): User | null {
  const users = getAllUsers()
  return users.find(user => user.id === id) || null
}

export function getUserByEmail(email: string): User | null {
  const users = getAllUsers()
  return users.find(user => user.email === email) || null
}

export function createUser(userData: Partial<User>): User {
  const users = getAllUsers()
  const newUser: User = {
    id: Date.now().toString(),
    email: userData.email!,
    fullName: userData.fullName || '',
    organization: userData.organization || '',
    position: userData.position || '',
    status: 'pending',
    role: 'user',
    passwordHash: null,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
    loginCount: 0,
    isActive: true,
    approvedBy: null,
    approvedAt: null,
    ...userData
  }
  
  users.push(newUser)
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
  
  // Log user creation
  logSystemEvent('user_action', 'info', `New user registered: ${newUser.email}`, { userId: newUser.id })
  
  return newUser
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = getAllUsers()
  const userIndex = users.findIndex(user => user.id === id)
  
  if (userIndex === -1) return null
  
  const oldUser = { ...users[userIndex] }
  users[userIndex] = { ...users[userIndex], ...updates }
  
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
  
  // Log user update
  logSystemEvent('user_action', 'info', `User updated: ${users[userIndex].email}`, { 
    userId: id, 
    changes: Object.keys(updates) 
  })
  
  return users[userIndex]
}

export function deleteUser(id: string): boolean {
  const users = getAllUsers()
  const userIndex = users.findIndex(user => user.id === id)
  
  if (userIndex === -1) return false
  
  const user = users[userIndex]
  users[userIndex] = { ...user, status: 'deleted', deletedAt: new Date().toISOString() }
  
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
  
  // Log user deletion
  logSystemEvent('user_action', 'warning', `User deleted: ${user.email}`, { userId: id })
  
  return true
}

// Login Attempt Functions
export function recordLoginAttempt(attempt: Omit<LoginAttempt, 'id'>): LoginAttempt {
  const attempts = getAllLoginAttempts()
  const newAttempt: LoginAttempt = {
    id: Date.now().toString(),
    ...attempt
  }
  
  attempts.push(newAttempt)
  fs.writeFileSync(LOGIN_ATTEMPTS_FILE, JSON.stringify(attempts, null, 2))
  
  return newAttempt
}

export function getAllLoginAttempts(): LoginAttempt[] {
  try {
    const data = fs.readFileSync(LOGIN_ATTEMPTS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading login attempts:', error)
    return []
  }
}

export function getLoginAttemptsByEmail(email: string): LoginAttempt[] {
  const attempts = getAllLoginAttempts()
  return attempts.filter(attempt => attempt.email === email)
}

export function getRecentFailedAttempts(minutes: number = 15): LoginAttempt[] {
  const attempts = getAllLoginAttempts()
  const cutoff = new Date(Date.now() - minutes * 60 * 1000)
  return attempts.filter(attempt => 
    !attempt.success && 
    new Date(attempt.attemptedAt) > cutoff
  )
}

// System Logging Functions
export function logSystemEvent(
  type: SystemLog['type'],
  level: SystemLog['level'],
  message: string,
  details: any = {},
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): SystemLog {
  const logs = getAllSystemLogs()
  const newLog: SystemLog = {
    id: Date.now().toString(),
    type,
    level,
    message,
    details,
    userId,
    ipAddress,
    userAgent,
    timestamp: new Date().toISOString()
  }
  
  logs.push(newLog)
  
  // Keep only last 1000 logs to prevent file from growing too large
  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000)
  }
  
  fs.writeFileSync(SYSTEM_LOGS_FILE, JSON.stringify(logs, null, 2))
  
  return newLog
}

export function getAllSystemLogs(): SystemLog[] {
  try {
    const data = fs.readFileSync(SYSTEM_LOGS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading system logs:', error)
    return []
  }
}

export function getSystemLogsByType(type: SystemLog['type']): SystemLog[] {
  const logs = getAllSystemLogs()
  return logs.filter(log => log.type === type)
}

export function getSecurityEvents(): SystemLog[] {
  const logs = getAllSystemLogs()
  return logs.filter(log => 
    log.type === 'security_event' || 
    (log.type === 'user_action' && ['warning', 'error', 'critical'].includes(log.level))
  )
}

// Security Functions
export function checkSuspiciousActivity(email: string, ipAddress: string): boolean {
  const recentFailures = getRecentFailedAttempts(15)
  const emailFailures = recentFailures.filter(attempt => attempt.email === email)
  const ipFailures = recentFailures.filter(attempt => attempt.ipAddress === ipAddress)
  
  // Consider suspicious if more than 5 failed attempts from same email or IP in 15 minutes
  return emailFailures.length > 5 || ipFailures.length > 5
}

export function getSecurityDashboard(): any {
  const users = getAllUsers()
  const loginAttempts = getAllLoginAttempts()
  const systemLogs = getAllSystemLogs()
  
  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  return {
    totalUsers: users.length,
    pendingUsers: users.filter(u => u.status === 'pending').length,
    activeUsers: users.filter(u => u.isActive).length,
    blockedUsers: users.filter(u => u.status === 'blocked').length,
    
    recentLoginAttempts: loginAttempts.filter(attempt => 
      new Date(attempt.attemptedAt) > last24Hours
    ).length,
    
    failedLoginAttempts: loginAttempts.filter(attempt => 
      !attempt.success && new Date(attempt.attemptedAt) > last24Hours
    ).length,
    
    securityEvents: systemLogs.filter(log => 
      log.type === 'security_event' && new Date(log.timestamp) > last24Hours
    ).length,
    
    suspiciousIPs: getRecentFailedAttempts(60).reduce((acc, attempt) => {
      acc[attempt.ipAddress] = (acc[attempt.ipAddress] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    
    recentActivity: systemLogs
      .filter(log => new Date(log.timestamp) > last24Hours)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
  }
}
