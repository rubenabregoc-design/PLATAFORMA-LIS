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

/**
 * Token JWT válido de 3 partes firmado con HS256 para PostgREST local (rol: postgres).
 * Generado a partir de jwt-secret en postgrest.conf.
 */
export const LOCAL_POSTGREST_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoicG9zdGdyZXMiLCJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsImlhdCI6MTc4OTQ0NTcxNSwiZXhwIjoyMTA0ODA1NzE1fQ.jkWvPtkx0kPAi0WryyoM6xeT5x8AnGunfDrQ4PR9iFo';

const localUrl = import.meta.env.VITE_SUPABASE_LOCAL_URL || 'http://localhost:8000';
const rawLocalKey = import.meta.env.VITE_SUPABASE_LOCAL_ANON_KEY;
const localKey = (rawLocalKey && rawLocalKey.split('.').length === 3) ? rawLocalKey : LOCAL_POSTGREST_JWT;

const cloudUrl = import.meta.env.VITE_SUPABASE_CLOUD_URL || supabaseUrl || 'https://placeholder.supabase.co';
const cloudKey = import.meta.env.VITE_SUPABASE_CLOUD_ANON_KEY || supabaseAnonKey || 'placeholder-key';

export const DATABASE_MODE: DatabaseMode = (import.meta.env.VITE_DATABASE_MODE as DatabaseMode) || 'HYBRID';
export const isLocalConfigured = Boolean(localUrl && !localUrl.includes('placeholder'));
export const isCloudConfigured = Boolean(cloudUrl && !cloudUrl.includes('placeholder'));

/**
 * Interceptor de fetch para arquitectura Híbrida:
 * Si la petición va a :8000 (PostgREST local), primero intenta el canal local.
 * Si el puerto 8000 no responde (ERR_CONNECTION_REFUSED) o devuelve 503,
 * conmuta automáticamente a Supabase Cloud sin mostrar errores en la consola.
 */
let localServerCheckedAndDown = false;
let lastLocalCheckTime = 0;

const customPostgrestFetch: typeof fetch = async (input, init) => {
  let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  const isLocal8000 = url.includes(':8000');

  if (isLocal8000) {
    const now = Date.now();
    const shouldTryLocal = !localServerCheckedAndDown || (now - lastLocalCheckTime > 30000);

    if (shouldTryLocal) {
      lastLocalCheckTime = now;
      const normalizedLocalUrl = url.replace(':8000/rest/v1', ':8000');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const response = await fetch(normalizedLocalUrl, {
          ...init,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.status < 500) {
          localServerCheckedAndDown = false;
          return response;
        }
      } catch {
        localServerCheckedAndDown = true;
      }
    }

    // ── FALLBACK TRANSPARENTE A SUPABASE CLOUD ──
    if (cloudUrl && !cloudUrl.includes('placeholder')) {
      const endpoint = url.split(':8000')[1] || '';
      const cleanEndpoint = endpoint.startsWith('/rest/v1') ? endpoint : `/rest/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      const cloudFullUrl = `${cloudUrl}${cleanEndpoint}`;

      const headers = new Headers(init?.headers || {});
      headers.set('apikey', cloudKey);
      headers.set('Authorization', `Bearer ${cloudKey}`);

      try {
        return await fetch(cloudFullUrl, {
          ...init,
          headers
        });
      } catch {
        // Fallback seguro silencioso
      }
    }

    // Si ni local ni nube responden, devolver array vacío con 200 OK para proteger la app
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return fetch(url, init);
};

export const supabaseLocal = createClient<Database>(localUrl, localKey, {
  global: {
    fetch: customPostgrestFetch,
  },
  auth: {
    storageKey: 'sb-local-lis-auth-token',
    persistSession: false,
    autoRefreshToken: false,
  }
});

export const supabaseCloud = createClient<Database>(cloudUrl, cloudKey, {
  auth: {
    storageKey: 'sb-cloud-lis-auth-token',
    persistSession: false,
    autoRefreshToken: false,
  }
});

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
 * In HYBRID and LOCAL_FIRST modes, it defaults to the ultra-fast local PostgREST engine (http://localhost:8000).
 */
const resolvedUrl = (DATABASE_MODE === 'LOCAL_FIRST' || DATABASE_MODE === 'HYBRID')
  ? (localUrl || 'http://localhost:8000')
  : (supabaseUrl || cloudUrl || 'https://placeholder.supabase.co');

const resolvedKey = (DATABASE_MODE === 'LOCAL_FIRST' || DATABASE_MODE === 'HYBRID')
  ? localKey
  : (supabaseAnonKey || cloudKey || 'placeholder-key');

export const supabase = createClient<Database>(
  resolvedUrl,
  resolvedKey,
  {
    global: {
      fetch: customPostgrestFetch,
    },
    auth: {
      storageKey: 'sb-main-lis-auth-token',
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

