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
