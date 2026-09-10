import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

// Polyfill WebSocket in Node/test environments where native WebSocket is absent
if (typeof WebSocket === 'undefined') {
  class DummyWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    readyState = 3;
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
  // @ts-ignore
  globalThis.WebSocket = DummyWebSocket;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase: Faltan variables de entorno (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY). ' +
    'El sistema funcionará en modo "Offline Mock" hasta que se configure el archivo .env.local'
  );
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// Hybrid Database Support (PostgreSQL / PostgREST Local + Cloud Supabase)
export type DatabaseMode = 'LOCAL_FIRST' | 'CLOUD_ONLY' | 'HYBRID' | 'MOCK';

export interface DatabaseHealthStatus {
  local: boolean;
  cloud: boolean;
  latencyLocalMs: number | null;
  latencyCloudMs: number | null;
}

const localUrl = import.meta.env.VITE_SUPABASE_LOCAL_URL || 'http://localhost:8000';
const localKey = import.meta.env.VITE_SUPABASE_LOCAL_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.local-placeholder';

const cloudUrl = import.meta.env.VITE_SUPABASE_CLOUD_URL || supabaseUrl || 'https://placeholder.supabase.co';
const cloudKey = import.meta.env.VITE_SUPABASE_CLOUD_ANON_KEY || supabaseAnonKey || 'placeholder-key';

export const DATABASE_MODE: DatabaseMode = (import.meta.env.VITE_DATABASE_MODE as DatabaseMode) || 'HYBRID';
export const isLocalConfigured = Boolean(localUrl && !localUrl.includes('placeholder'));
export const isCloudConfigured = Boolean(cloudUrl && !cloudUrl.includes('placeholder'));

export const supabaseLocal = createClient<Database>(localUrl, localKey);
export const supabaseCloud = createClient<Database>(cloudUrl, cloudKey);

export async function testDatabaseConnections(): Promise<DatabaseHealthStatus> {
  let local = false;
  let cloud = false;
  let latencyLocalMs: number | null = null;
  let latencyCloudMs: number | null = null;

  try {
    const t0 = performance.now();
    const res = await fetch(`${localUrl}`, { method: 'HEAD', signal: AbortSignal.timeout(2000) }).catch(() => null);
    if (res && res.status < 500) {
      local = true;
      latencyLocalMs = Math.round(performance.now() - t0);
    }
  } catch {
    local = false;
  }

  try {
    const t0 = performance.now();
    const { error } = await supabaseCloud.from('tenants').select('id').limit(1).abortSignal(AbortSignal.timeout(3000));
    if (!error) {
      cloud = true;
      latencyCloudMs = Math.round(performance.now() - t0);
    }
  } catch {
    cloud = false;
  }

  return { local, cloud, latencyLocalMs, latencyCloudMs };
}

// Polyfill global WebSocket for Node.js test environments where native WebSocket is absent
if (typeof globalThis.WebSocket === 'undefined' && typeof window === 'undefined') {
  (globalThis as any).WebSocket = class DummyWebSocket {
    addEventListener() {}
    removeEventListener() {}
    close() {}
    send() {}
  };
}

/**
 * Typed Supabase client — all .from() calls are inferred from Database schema.
 * See: src/database.types.ts (generated from supabase/migrations/20260810_initial_schema.sql)
 */
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

