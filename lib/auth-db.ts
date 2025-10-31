import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'auth.json');

// In-memory fallback database (for Vercel)
let inMemoryDB: AuthDatabase | null = null;

interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  organization: string;
  position?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'DELETED';
  role: 'ADMIN' | 'USER';
  passwordHash?: string;
  createdAt: string;
  lastLoginAt?: string;
  loginCount: number;
  isActive: boolean;
  approvedBy?: string;
  approvedAt?: string;
  requestedIndexAccess?: string;
}

interface PasswordRecord {
  email: string;
  plainPassword: string;
  generatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

interface GeneratedPasswordHistory {
  id: string;
  email: string;
  password: string;
  generatedAt: string;
  generatedBy: string;
  userEmail?: string;
  userName?: string;
}

interface AuthDatabase {
  users: UserRecord[];
  passwords: PasswordRecord[];
  generatedPasswordHistory: GeneratedPasswordHistory[];
}

// Check if running on Vercel
const isVercel = !!process.env.VERCEL;

// Ensure data directory exists
function ensureDataDir() {
  if (isVercel) return; // Skip on Vercel
  const dataDir = path.dirname(DB_PATH);
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not create data directory:', e);
  }
}

// Load database from file or environment
function loadDatabase(): AuthDatabase {
  // If on Vercel or file system not available, use in-memory storage
  if (isVercel || !canAccessFileSystem()) {
    if (inMemoryDB) return inMemoryDB;
    
    // Try to load from environment variable
    try {
      const dbString = process.env.AUTH_DATABASE;
      if (dbString) {
        inMemoryDB = JSON.parse(dbString);
        return inMemoryDB;
      }
    } catch (e) {
      console.warn('Could not parse AUTH_DATABASE env var:', e);
    }
    
    // Initialize empty database
    inMemoryDB = { users: [], passwords: [], generatedPasswordHistory: [] };
    return inMemoryDB;
  }

  // File system is available, use it
  ensureDataDir();
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Could not read database file:', e);
  }
  
  return { users: [], passwords: [], generatedPasswordHistory: [] };
}

// Check if file system is accessible
function canAccessFileSystem(): boolean {
  try {
    const testFile = path.join(process.cwd(), 'package.json');
    return fs.existsSync(testFile);
  } catch {
    return false;
  }
}

// Save database to file and/or environment
function saveDatabase(db: AuthDatabase) {
  // Always keep in-memory copy
  inMemoryDB = db;

  // Try to save to file if on local
  if (!isVercel && canAccessFileSystem()) {
    try {
      ensureDataDir();
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    } catch (e) {
      console.warn('Could not save to file system:', e);
    }
  }

  // Note: To persist on Vercel, set AUTH_DATABASE environment variable
  // with JSON-stringified database. This is optional and mainly for admin reference.
}

// Initialize with admin user if not exists
function initializeAdmin() {
  const db = loadDatabase();
  const adminExists = db.users.some(u => u.email === 'admin@genera.com');
  
  if (!adminExists) {
    const adminHash = '$2b$12$5J5czcjGWix07Tn.FTfjTOFfGKE/W7efcSgKXyXjF2inCeT7Zm3KS'; // admin123
    db.users.push({
      id: 'admin-user-1',
      email: 'admin@genera.com',
      fullName: 'Administrator',
      organization: 'Géner.A System',
      position: 'System Administrator',
      status: 'APPROVED',
      role: 'ADMIN',
      passwordHash: adminHash,
      createdAt: new Date().toISOString(),
      loginCount: 0,
      isActive: true,
      approvedBy: 'system',
      approvedAt: new Date().toISOString(),
    });
    saveDatabase(db);
  }
}

// User operations
export const AuthDB = {
  findUserByEmail(email: string): UserRecord | undefined {
    const db = loadDatabase();
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  findUserById(id: string): UserRecord | undefined {
    const db = loadDatabase();
    return db.users.find(u => u.id === id);
  },

  createUser(user: Omit<UserRecord, 'id' | 'createdAt' | 'loginCount'>): UserRecord {
    const db = loadDatabase();
    const newUser: UserRecord = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      loginCount: 0,
    };
    db.users.push(newUser);
    saveDatabase(db);
    return newUser;
  },

  updateUser(id: string, updates: Partial<UserRecord>): UserRecord | null {
    const db = loadDatabase();
    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;
    
    db.users[userIndex] = { ...db.users[userIndex], ...updates };
    saveDatabase(db);
    return db.users[userIndex];
  },

  getAllUsers(): UserRecord[] {
    const db = loadDatabase();
    return db.users;
  },

  savePassword(email: string, plainPassword: string, approved: boolean = false): void {
    const db = loadDatabase();
    const existingIndex = db.passwords.findIndex(p => p.email.toLowerCase() === email.toLowerCase());
    
    const passwordRecord: PasswordRecord = {
      email: email.toLowerCase(),
      plainPassword,
      generatedAt: new Date().toISOString(),
      approvedAt: approved ? new Date().toISOString() : undefined,
      approvedBy: approved ? 'admin' : undefined,
    };
    
    if (existingIndex !== -1) {
      db.passwords[existingIndex] = passwordRecord;
    } else {
      db.passwords.push(passwordRecord);
    }
    saveDatabase(db);
  },

  getPassword(email: string): PasswordRecord | undefined {
    const db = loadDatabase();
    return db.passwords.find(p => p.email.toLowerCase() === email.toLowerCase());
  },

  deleteAllUsers(): void {
    const db = { users: [], passwords: [], generatedPasswordHistory: [] };
    saveDatabase(db);
    initializeAdmin();
  },

  recordPasswordGeneration(email: string, password: string, generatedBy: string = 'admin'): void {
    const db = loadDatabase();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    const record: GeneratedPasswordHistory = {
      id: `pwd-${Date.now()}`,
      email: email.toLowerCase(),
      password,
      generatedAt: new Date().toISOString(),
      generatedBy,
      userName: user?.fullName,
      userEmail: user?.email,
    };
    
    db.generatedPasswordHistory.push(record);
    saveDatabase(db);
  },

  getGeneratedPasswordHistory(limit: number = 10): GeneratedPasswordHistory[] {
    const db = loadDatabase();
    return db.generatedPasswordHistory
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      .slice(0, limit);
  },

  clearPasswordHistory(): void {
    const db = loadDatabase();
    db.generatedPasswordHistory = [];
    saveDatabase(db);
  },

  // Export database as JSON string (for environment variable backup)
  exportAsJSON(): string {
    const db = loadDatabase();
    return JSON.stringify(db);
  },

  // Import database from JSON string
  importFromJSON(jsonString: string): void {
    try {
      const db = JSON.parse(jsonString);
      saveDatabase(db);
    } catch (e) {
      console.error('Failed to import database:', e);
    }
  }
};

// Initialize on module load
initializeAdmin();
