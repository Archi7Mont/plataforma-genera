import fs from 'fs';
import path from 'path';

// Simple storage adapter with Vercel KV (if configured) and FS fallback

type JsonValue = any;

function ensureKvEnvFromAliases(): void {
  if (!process.env.KV_REST_API_URL) {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      process.env.KV_REST_API_URL = process.env.UPSTASH_REDIS_REST_URL;
    } else if (process.env.KV_REST_API_KV_REST_API_URL) {
      process.env.KV_REST_API_URL = process.env.KV_REST_API_KV_REST_API_URL as string;
    } else if (process.env.KV_REST_API_KV_URL) {
      process.env.KV_REST_API_URL = process.env.KV_REST_API_KV_URL as string;
    }
  }
  if (!process.env.KV_REST_API_TOKEN) {
    if (process.env.UPSTASH_REDIS_REST_TOKEN) {
      process.env.KV_REST_API_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
    } else if (process.env.KV_REST_API_KV_REST_API_TOKEN) {
      process.env.KV_REST_API_TOKEN = process.env.KV_REST_API_KV_REST_API_TOKEN as string;
    }
  }
}

function isKvConfigured(): boolean {
  ensureKvEnvFromAliases();
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Lazy import to avoid bundling issues when KV is not configured
async function getKv() {
  ensureKvEnvFromAliases();
  const { kv } = await import('@vercel/kv');
  return kv as any;
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
    if (isKvConfigured()) {
      try {
        const kv = await getKv();
        const value = await kv.get<T>(key);
        if (value === null || value === undefined) return fallback;
        return value as T;
      } catch {
        // Fallback to FS on any KV error
        return fsReadJson<T>(mapKeyToFile(key), fallback);
      }
    }
    return fsReadJson<T>(mapKeyToFile(key), fallback);
  },
  async setJson(key: string, value: JsonValue): Promise<void> {
    if (isKvConfigured()) {
      try {
        const kv = await getKv();
        await kv.set(key, value);
        return;
      } catch {
        // Fallthrough to FS write
      }
    }
    fsWriteJson(mapKeyToFile(key), value);
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


