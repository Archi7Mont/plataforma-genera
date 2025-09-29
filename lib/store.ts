import { prisma } from './db';

type JsonValue = any;

// Use Prisma/Supabase for all storage operations
export const store = {
  async getJson<T = JsonValue>(key: string, fallback: T): Promise<T> {
    try {
      // Map store keys to database models
      switch (key) {
        case 'users':
          const users = await prisma.user.findMany();
          return users as T;
        case 'generated_passwords':
        case 'passwords':
          const passwords = await prisma.password.findMany();
          return passwords as T;
        case 'questions':
          const questions = await prisma.question.findMany();
          return questions as T;
        case 'password_reset_requests':
          const requests = await prisma.passwordResetRequest.findMany();
          return requests as T;
        default:
          console.log(`Unknown store key: ${key}, returning fallback`);
          return fallback;
      }
    } catch (error) {
      console.error(`Error getting ${key} from database:`, error);
      return fallback;
    }
  },

  async setJson(key: string, value: JsonValue): Promise<void> {
    try {
      // Map store keys to database models
      switch (key) {
        case 'users':
          // This is handled by the API routes directly
          console.log(`User operations handled by API routes, skipping store set for ${key}`);
          break;
        case 'generated_passwords':
        case 'passwords':
          // This is handled by the API routes directly
          console.log(`Password operations handled by API routes, skipping store set for ${key}`);
          break;
        case 'questions':
          // This is handled by the API routes directly
          console.log(`Question operations handled by API routes, skipping store set for ${key}`);
          break;
        case 'password_reset_requests':
          // This is handled by the API routes directly
          console.log(`Password reset request operations handled by API routes, skipping store set for ${key}`);
          break;
        default:
          console.log(`Unknown store key: ${key}, skipping set operation`);
      }
    } catch (error) {
      console.error(`Error setting ${key} in database:`, error);
    }
  }
};


