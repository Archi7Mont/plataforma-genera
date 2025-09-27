import fs from 'fs';
import path from 'path';

// Simple storage adapter with Vercel KV (if configured) and FS fallback

type JsonValue = any;

function ensureKvEnvFromAliases(): void {
  if (!process.env.KV_REST_API_URL) {
    // Only map Upstash URLs, not internal Vercel variables
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL.startsWith('https://')) {
      process.env.KV_REST_API_URL = process.env.UPSTASH_REDIS_REST_URL;
    }
  }
  if (!process.env.KV_REST_API_TOKEN) {
    // Only map Upstash tokens
    if (process.env.UPSTASH_REDIS_REST_TOKEN) {
      process.env.KV_REST_API_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
    }
  }
}

function isKvConfigured(): boolean {
  ensureKvEnvFromAliases();

  // Check if we have valid KV credentials (not just "SET" placeholders)
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  // Must have both URL and token, and URL must be a proper HTTPS URL
  if (!url || !token || url === 'SET' || token === 'SET' || !url.startsWith('https://')) {
    return false;
  }

  return true;
}

// Lazy import to avoid bundling issues when KV is not configured
async function getKv() {
  ensureKvEnvFromAliases();
  // Only import KV if it's actually configured
  if (!isKvConfigured()) {
    throw new Error('KV not configured - missing required environment variables');
  }

  try {
    const { kv } = await import('@vercel/kv');
    return kv as any;
  } catch (error) {
    console.error('Failed to import @vercel/kv:', error);
    throw error;
  }
}

function getRuntimeDataDir(): string {
  const repoDataDir = path.join(process.cwd(), 'data');
  const runtimeDataDir = process.env.VERCEL ? path.join('/tmp', 'data') : repoDataDir;
  if (!fs.existsSync(runtimeDataDir)) fs.mkdirSync(runtimeDataDir, { recursive: true });
  return runtimeDataDir;
}

function fsReadJson<T = JsonValue>(filename: string, fallback: T): T {
  const runtimeDataDir = getRuntimeDataDir();
  const file = path.join(runtimeDataDir, filename);
  if (!fs.existsSync(file)) {
    // Seed from repo if available; otherwise write fallback
    const seed = path.join(process.cwd(), 'data', filename);
    if (fs.existsSync(seed)) {
      fs.copyFileSync(seed, file);
    } else {
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    }
  }
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function fsWriteJson(filename: string, value: JsonValue) {
  const runtimeDataDir = getRuntimeDataDir();
  const file = path.join(runtimeDataDir, filename);
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

export const store = {
  async getJson<T = JsonValue>(key: string, fallback: T): Promise<T> {
    console.log(`Getting ${key} from store`);
    if (isKvConfigured()) {
      try {
        const kv = await getKv();
        const value = await kv.get<T>(key);
        console.log(`KV get ${key}:`, value !== null && value !== undefined ? 'SUCCESS' : 'NULL/UNDEFINED');
        if (value === null || value === undefined) return fallback;
        return value as T;
      } catch (error) {
        console.error('KV read error for key', key, ':', error);
        // Always fallback to filesystem if KV fails, regardless of environment
        console.log('Falling back to filesystem for', key);
        const fsValue = fsReadJson<T>(mapKeyToFile(key), fallback);
        console.log(`FS get ${key} fallback:`, Array.isArray(fsValue) ? fsValue.length : typeof fsValue);
        return fsValue;
      }
    }
    const fsValue = fsReadJson<T>(mapKeyToFile(key), fallback);
    console.log(`FS get ${key}:`, Array.isArray(fsValue) ? fsValue.length : typeof fsValue);
    return fsValue;
  },
  async setJson(key: string, value: JsonValue): Promise<void> {
    console.log(`Setting ${key} in store, data size:`, Array.isArray(value) ? value.length : typeof value);
    if (isKvConfigured()) {
      try {
        const kv = await getKv();
        await kv.set(key, value);
        console.log('Successfully wrote to KV for key:', key);
        // Also write to filesystem as backup in production
        if (process.env.NODE_ENV === 'production') {
          fsWriteJson(mapKeyToFile(key), value);
          console.log('Also wrote to FS backup for key:', key);
        }
        return;
      } catch (error) {
        console.error('KV write error for key', key, ':', error);
        // Fallback to filesystem if KV fails
        console.log('Falling back to filesystem for', key);
        fsWriteJson(mapKeyToFile(key), value);
        console.log('Wrote to FS fallback for key:', key);
      }
    }
    fsWriteJson(mapKeyToFile(key), value);
    console.log('Wrote to FS for key:', key);
  }
};

function mapKeyToFile(key: string): string {
  switch (key) {
    case 'users':
      return 'users.json';
    case 'generated_passwords':
      return 'generated_passwords.json';
    case 'login_attempts':
      return 'login_attempts.json';
    case 'system_logs':
      return 'system_logs.json';
    case 'questions':
      return 'questions.json';
    case 'password_reset_requests':
      return 'password_reset_requests.json';
    default:
      return `${key}.json`;
  }
}


