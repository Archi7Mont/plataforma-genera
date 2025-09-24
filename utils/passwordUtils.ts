/**
 * Password generation and management utilities
 */

export interface PasswordInfo {
  email: string;
  password: string;
  generatedAt: string;
  generatedBy: string;
}

/**
 * Generate a secure random password
 * @param length - Length of the password (default: 12)
 * @returns Generated password
 */
export function generateSecurePassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each category
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate a simple password for demo purposes
 * @param length - Length of the password (default: 8)
 * @returns Generated password
 */
export function generateSimplePassword(length: number = 8): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  return password;
}

/**
 * Save password to localStorage
 * @param email - User email
 * @param password - Generated password
 * @param generatedBy - Who generated the password
 */
export function savePassword(email: string, password: string, generatedBy: string): void {
  const passwordInfo: PasswordInfo = {
    email,
    password,
    generatedAt: new Date().toISOString(),
    generatedBy
  };
  
  console.log('savePassword - saving for:', email, 'password:', password);
  const existingPasswords = getStoredPasswords();
  const updatedPasswords = existingPasswords.filter(p => p.email !== email);
  updatedPasswords.push(passwordInfo);
  
  console.log('savePassword - updated passwords:', updatedPasswords);
  localStorage.setItem('genera_passwords', JSON.stringify(updatedPasswords));
  console.log('savePassword - saved to localStorage');
}

/**
 * Get stored passwords from localStorage
 * @returns Array of password information
 */
export function getStoredPasswords(): PasswordInfo[] {
  const stored = localStorage.getItem('genera_passwords');
  console.log('getStoredPasswords - localStorage data:', stored);
  const result = stored ? JSON.parse(stored) : [];
  console.log('getStoredPasswords - parsed result:', result);
  return result;
}

/**
 * Get password for a specific user
 * @param email - User email
 * @returns Password info or null if not found
 */
export function getPasswordForUser(email: string): PasswordInfo | null {
  const passwords = getStoredPasswords();
  return passwords.find(p => p.email === email) || null;
}

/**
 * Delete password for a specific user
 * @param email - User email
 */
export function deletePasswordForUser(email: string): void {
  const passwords = getStoredPasswords();
  const updatedPasswords = passwords.filter(p => p.email !== email);
  localStorage.setItem('genera_passwords', JSON.stringify(updatedPasswords));
}

/**
 * Clear all stored passwords
 */
export function clearAllPasswords(): void {
  localStorage.removeItem('genera_passwords');
}

/**
 * Check localStorage health and provide diagnostics
 */
export function checkLocalStorageHealth(): { healthy: boolean; issues: string[]; data: any } {
  const issues: string[] = [];
  let data = null;
  
  try {
    // Test basic localStorage functionality
    const testKey = 'genera_test_' + Date.now();
    localStorage.setItem(testKey, 'test');
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved !== 'test') {
      issues.push('localStorage basic read/write test failed');
    }
    
    // Check password hash data (new system)
    const storedHashes = localStorage.getItem('genera_password_hashes');
    const storedPasswords = localStorage.getItem('genera_passwords');
    
    if (storedHashes) {
      try {
        data = JSON.parse(storedHashes);
        if (!Array.isArray(data)) {
          issues.push('Password hash data is not an array');
        }
      } catch (e) {
        issues.push('Password hash data is corrupted JSON: ' + e);
      }
    } else if (storedPasswords) {
      // Legacy password system still exists
      issues.push('Legacy password system detected - consider migrating to new hash system');
      try {
        data = JSON.parse(storedPasswords);
        if (!Array.isArray(data)) {
          issues.push('Legacy password data is not an array');
        }
      } catch (e) {
        issues.push('Legacy password data is corrupted JSON: ' + e);
      }
    } else {
      issues.push('No password data found in localStorage');
    }
    
    // Check localStorage quota
    try {
      const quota = navigator.storage?.estimate?.();
      if (quota && quota.usage && quota.quota) {
        const usagePercent = (quota.usage / quota.quota) * 100;
        if (usagePercent > 90) {
          issues.push(`localStorage is ${usagePercent.toFixed(1)}% full`);
        }
      }
    } catch (e) {
      // Storage API not available, skip quota check
    }
    
  } catch (e) {
    issues.push('localStorage access error: ' + e);
  }
  
  return {
    healthy: issues.length === 0,
    issues,
    data
  };
}

