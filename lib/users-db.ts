// Simple file-based database for Vercel deployment
// In production, this should be replaced with a real database like PostgreSQL, MongoDB, etc.

import fs from 'fs'
import path from 'path'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Read users from file
export function readUsers(): any[] {
  try {
    ensureDataDir()
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading users file:', error)
  }
  
  // Return default users if file doesn't exist or error
  return [
    {
      id: "1",
      email: "usuario1@ejemplo.com",
      status: "pending",
      loginTime: new Date().toISOString(),
    },
    {
      id: "2", 
      email: "usuario2@ejemplo.com",
      status: "approved",
      loginTime: new Date(Date.now() - 86400000).toISOString(),
      approvedBy: "admin@genera.com",
      approvedAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ]
}

// Write users to file
export function writeUsers(users: any[]): void {
  try {
    ensureDataDir()
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
  } catch (error) {
    console.error('Error writing users file:', error)
  }
}

// Add a new user
export function addUser(email: string): any {
  const users = readUsers()
  
  // Check if user already exists
  const existingUser = users.find(user => user.email === email)
  if (existingUser) {
    return null // User already exists
  }
  
  const newUser = {
    id: Date.now().toString(),
    email,
    status: 'pending',
    loginTime: new Date().toISOString()
  }
  
  users.push(newUser)
  writeUsers(users)
  return newUser
}

// Update user status
export function updateUserStatus(userId: string, status: string, updatedBy: string): any[] {
  const users = readUsers()
  const updatedUsers = users.map(user => {
    if (user.id === userId) {
      const updateData: any = {
        ...user,
        status,
        [`${status}edBy`]: updatedBy,
        [`${status}edAt`]: new Date().toISOString()
      }
      
      // Special case for unblock
      if (status === 'approved' && user.status === 'blocked') {
        updateData.unblockedBy = updatedBy
        updateData.unblockedAt = new Date().toISOString()
      }
      
      return updateData
    }
    return user
  })
  
  writeUsers(updatedUsers)
  return updatedUsers
}
