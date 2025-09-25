import { generateSecurePassword } from './auth';
import { checkLocalStorageHealth } from '../utils/passwordUtils';

// Simple password hashing for development (not secure for production)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

// Simple password verification for development
function simpleVerify(password: string, hash: string): boolean {
  return simpleHash(password) === hash;
}

export interface PasswordInfo {
  email: string;
  passwordHash: string; // Store hash, not plain password
  plainPassword?: string; // Store plain password temporarily for admin display
  generatedAt: string;
  generatedBy: string;
}

/**
 * Save password hash to localStorage (in production, this would be a database)
 * Only works in browser environment
 */
export function savePasswordHash(email: string, password: string, generatedBy: string, storePlainPassword: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('savePasswordHash: localStorage not available (server-side)');
      // For server-side, just resolve without saving (development mode)
      resolve();
      return;
    }

    try {
      const passwordHash = simpleHash(password);
      const passwordInfo: PasswordInfo = {
        email,
        passwordHash,
        generatedAt: new Date().toISOString(),
        generatedBy
      };

      // Only store plain password if explicitly requested (for admin display)
      if (storePlainPassword) {
        passwordInfo.plainPassword = password;
      }

      const existingPasswords = getStoredPasswordHashes();
      const updatedPasswords = existingPasswords.filter(p => p.email !== email);
      updatedPasswords.push(passwordInfo);

      localStorage.setItem('genera_password_hashes', JSON.stringify(updatedPasswords));
      resolve();
    } catch (error) {
      console.error('Error saving password hash:', error);
      reject(error);
    }
  });
}

/**
 * Get stored password hashes from localStorage
 * Only works in browser environment
 */
export function getStoredPasswordHashes(): PasswordInfo[] {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.warn('getStoredPasswordHashes: localStorage not available (server-side)');
    return [];
  }

  try {
    const stored = localStorage.getItem('genera_password_hashes');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading password hashes from localStorage:', error);
    return [];
  }
}

/**
 * Get password hash for a specific user
 * Only works in browser environment
 */
export function getPasswordHashForUser(email: string): PasswordInfo | null {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.warn('getPasswordHashForUser: localStorage not available (server-side)');
    return null;
  }

  try {
    const passwords = getStoredPasswordHashes();
    return passwords.find(p => p.email === email) || null;
  } catch (error) {
    console.error('Error reading password hash for user:', error);
    return null;
  }
}

/**
 * Verify a password against stored hash
 * Works in both browser and server environments
 */
export async function verifyUserPassword(email: string, password: string): Promise<boolean> {
  try {
    // Special case for admin user - check plain text password first
    if (email === 'admin@genera.com') {
      if (password === 'Admin1234!') {
        console.log('Admin password verification (plain text):', { email, isValid: true });
        return true;
      }
    }

    // Note: Database verification is handled in the login API
    // This function only handles localStorage and plain text verification

    // Fallback: Try to get password from localStorage (browser)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const passwordInfo = getPasswordHashForUser(email);
      if (passwordInfo) {
        return simpleVerify(password, passwordInfo.passwordHash);
      }
    }

    // Fallback: Check if it's a plain text password match (for generated passwords)
    // This handles cases where passwords are stored as plain text temporarily
    const passwords = getStoredPasswordHashes();
    const passwordInfo = passwords.find(p => p.email === email);
    
    if (passwordInfo) {
      // Check if it's a plain text password (for generated passwords)
      if (passwordInfo.plainPassword && password === passwordInfo.plainPassword) {
        console.log('Password verification (plain text):', { email, isValid: true });
        return true;
      }
      
      // Check if it's a hash match
      return simpleVerify(password, passwordInfo.passwordHash);
    }

    console.log('No password found for user:', email);
    return false;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Generate and save a secure password for a user
 */
export async function generateAndSavePassword(email: string, generatedBy: string, storePlainPassword: boolean = false): Promise<string> {
  const password = generateSecurePassword();
  await savePasswordHash(email, password, generatedBy, storePlainPassword);
  return password;
}

/**
 * Delete password hash for a specific user
 */
export function deletePasswordHash(email: string): void {
  const passwords = getStoredPasswordHashes();
  const updatedPasswords = passwords.filter(p => p.email !== email);
  localStorage.setItem('genera_password_hashes', JSON.stringify(updatedPasswords));
}

/**
 * Clear all stored password hashes
 */
export function clearAllPasswordHashes(): void {
  localStorage.removeItem('genera_password_hashes');
}

// Re-export checkLocalStorageHealth for compatibility
export { checkLocalStorageHealth };
