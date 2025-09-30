// Simple demo storage for when database is not available
export interface DemoUser {
  id: string;
  email: string;
  fullName: string;
  organization: string;
  position: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'DELETED';
  role: 'ADMIN' | 'USER';
  passwordHash: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  loginCount: number;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  blockedBy: string | null;
  blockedAt: string | null;
  unblockedBy: string | null;
  unblockedAt: string | null;
  deletedBy: string | null;
  deletedAt: string | null;
  requestedIndexAccess: string | null;
}

class DemoStorage {
  private users: DemoUser[] = [
    {
      id: 'demo-admin',
      email: 'admin@genera.com',
      fullName: 'Administrator',
      organization: 'Géner.A System',
      position: 'System Administrator',
      status: 'APPROVED',
      role: 'ADMIN',
      passwordHash: null,
      isActive: true,
      loginCount: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      approvedBy: 'system',
      approvedAt: new Date().toISOString(),
      rejectedBy: null,
      rejectedAt: null,
      blockedBy: null,
      blockedAt: null,
      unblockedBy: null,
      unblockedAt: null,
      deletedBy: null,
      deletedAt: null,
      requestedIndexAccess: null
    }
  ];

  getUsers(): DemoUser[] {
    return [...this.users];
  }

  addUser(user: DemoUser): DemoUser {
    // Check if user already exists
    const existingIndex = this.users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex >= 0) {
      // Update existing user
      this.users[existingIndex] = { ...this.users[existingIndex], ...user };
      return this.users[existingIndex];
    } else {
      // Add new user
      this.users.push(user);
      return user;
    }
  }

  updateUser(id: string, updates: Partial<DemoUser>): DemoUser | null {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex >= 0) {
      this.users[userIndex] = { ...this.users[userIndex], ...updates };
      return this.users[userIndex];
    }
    return null;
  }

  deleteUser(id: string): boolean {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex >= 0) {
      this.users.splice(userIndex, 1);
      return true;
    }
    return false;
  }

  findUserByEmail(email: string): DemoUser | null {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
}

// Export a singleton instance
export const demoStorage = new DemoStorage();
