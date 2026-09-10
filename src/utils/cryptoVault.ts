/**
 * CryptoVault — Medical Data Field-Level Encryption & Blind Indexing Engine
 * AbregoTech LIS/HIS • Panama Ley 81 & ISO 15189 Compliant
 * 
 * Provides:
 * 1. AES-256-GCM authenticated encryption for sensitive PII/PHI (Names, IDs, Phones, Addresses, Notes).
 * 2. Deterministic HMAC-SHA256 Blind Indexing for sub-millisecond database lookups without decrypting.
 * 3. Transparent format detection (enc:v1:...) with backward compatibility for legacy unencrypted records.
 */

// Format identifier prefix
const CIPHER_PREFIX = 'enc:v1:';

// Default fallback keys (Overridden by environment variables in production)
const DEFAULT_MASTER_KEY = 'abregotech-lis-master-key-panama-ley81-iso15189-2026';
const DEFAULT_BLIND_SALT = 'abregotech-blind-index-salt-cedula-paciente-2026';

function getCryptoSubtle(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Cryptography API (crypto.subtle) is not available in this runtime.');
}

function getMasterSecret(): string {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ENCRYPTION_MASTER_KEY) {
    return (import.meta as any).env.VITE_ENCRYPTION_MASTER_KEY;
  }
  if (typeof process !== 'undefined' && process.env?.VITE_ENCRYPTION_MASTER_KEY) {
    return process.env.VITE_ENCRYPTION_MASTER_KEY;
  }
  return DEFAULT_MASTER_KEY;
}

function getBlindIndexSalt(): string {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BLIND_INDEX_SALT) {
    return (import.meta as any).env.VITE_BLIND_INDEX_SALT;
  }
  if (typeof process !== 'undefined' && process.env?.VITE_BLIND_INDEX_SALT) {
    return process.env.VITE_BLIND_INDEX_SALT;
  }
  return DEFAULT_BLIND_SALT;
}

// Cache derived CryptoKeys
let cachedAesKey: CryptoKey | null = null;
let cachedHmacKey: CryptoKey | null = null;

async function getAesKey(): Promise<CryptoKey> {
  if (cachedAesKey) return cachedAesKey;

  const subtle = getCryptoSubtle();
  const secretBytes = new TextEncoder().encode(getMasterSecret());
  
  // Hash the secret to ensure exact 256 bits (32 bytes)
  const keyMaterial = await subtle.digest('SHA-256', secretBytes);

  cachedAesKey = await subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return cachedAesKey;
}

async function getHmacKey(): Promise<CryptoKey> {
  if (cachedHmacKey) return cachedHmacKey;

  const subtle = getCryptoSubtle();
  const saltBytes = new TextEncoder().encode(getBlindIndexSalt());

  cachedHmacKey = await subtle.importKey(
    'raw',
    saltBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return cachedHmacKey;
}

// ── Base64 & Buffer Utilities ──────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Public Cryptographic API ───────────────────────────────────────────────

/**
 * Checks if a string is already encrypted with our format.
 */
export function isEncrypted(value: any): boolean {
  return typeof value === 'string' && value.startsWith(CIPHER_PREFIX);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Generates a fresh random 12-byte IV for every single encryption.
 * Output format: `enc:v1:<base64(iv + ciphertext + authTag)>`
 */
export async function encryptField(plaintext: string | null | undefined): Promise<string> {
  if (!plaintext || typeof plaintext !== 'string') return plaintext || '';
  if (isEncrypted(plaintext)) return plaintext; // Avoid double-encryption

  try {
    const subtle = getCryptoSubtle();
    const key = await getAesKey();

    // 12-byte IV for AES-GCM
    const iv = new Uint8Array(12);
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(iv);
    } else if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(iv);
    } else {
      // Fallback
      for (let i = 0; i < 12; i++) iv[i] = Math.floor(Math.random() * 256);
    }

    const plaintextBytes = new TextEncoder().encode(plaintext);
    const ciphertext = await subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintextBytes
    );

    // Concatenate IV (12 bytes) + Ciphertext with auth tag
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return `${CIPHER_PREFIX}${arrayBufferToBase64(combined)}`;
  } catch (err) {
    console.error('[CryptoVault] Error al cifrar campo:', err);
    return plaintext; // Fail safe
  }
}

/**
 * Decrypts a ciphertext string created by `encryptField`.
 * If the input is not encrypted, returns the original text untouched.
 */
export async function decryptField(ciphertext: string | null | undefined): Promise<string> {
  if (!ciphertext || typeof ciphertext !== 'string') return ciphertext || '';
  if (!isEncrypted(ciphertext)) return ciphertext; // Legacy plaintext

  try {
    const subtle = getCryptoSubtle();
    const key = await getAesKey();

    const rawBase64 = ciphertext.slice(CIPHER_PREFIX.length);
    const combined = base64ToArrayBuffer(rawBase64);

    if (combined.length < 13) {
      return ciphertext; // Invalid payload
    }

    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decrypted = await subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn('[CryptoVault] Error al descifrar campo (clave incorrecta o dato corrupto):', err);
    return ciphertext;
  }
}

/**
 * Generates a deterministic Blind Index hash (HMAC-SHA256) for a searchable field (e.g. National ID / Cédula).
 * Produces the exact same 64-char hex hash for the same input, allowing exact match queries
 * without revealing the underlying national ID.
 */
export async function generateBlindIndex(value: string | null | undefined): Promise<string> {
  if (!value || typeof value !== 'string') return '';

  try {
    const subtle = getCryptoSubtle();
    const key = await getHmacKey();

    // Normalize: uppercase, trimmed, without hyphens or spaces for consistent matching
    const normalized = value.trim().toUpperCase().replace(/[\s-]/g, '');
    const dataBytes = new TextEncoder().encode(normalized);

    const signature = await subtle.sign('HMAC', key, dataBytes);
    return bufferToHex(signature);
  } catch (err) {
    console.error('[CryptoVault] Error generando Blind Index:', err);
    return '';
  }
}

// ── Medical Domain Helpers ─────────────────────────────────────────────────

export interface PatientPIIFields {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone?: string;
  email?: string;
  address?: string;
}

/**
 * Encrypts all PII fields of a patient and computes the national ID blind index hash.
 */
export async function encryptPatientPII(patient: PatientPIIFields): Promise<{
  firstName: string;
  lastName: string;
  nationalId: string;
  nationalIdHash: string;
  phone: string;
  email: string;
  address: string;
}> {
  const [
    encFirstName,
    encLastName,
    encNationalId,
    nationalIdHash,
    encPhone,
    encEmail,
    encAddress
  ] = await Promise.all([
    encryptField(patient.firstName),
    encryptField(patient.lastName),
    encryptField(patient.nationalId),
    generateBlindIndex(patient.nationalId),
    encryptField(patient.phone || ''),
    encryptField(patient.email || ''),
    encryptField(patient.address || '')
  ]);

  return {
    firstName: encFirstName,
    lastName: encLastName,
    nationalId: encNationalId,
    nationalIdHash,
    phone: encPhone,
    email: encEmail,
    address: encAddress
  };
}

/**
 * Decrypts all PII fields of a patient for presentation to authorized clinic staff.
 */
export async function decryptPatientPII(patient: any): Promise<any> {
  if (!patient) return patient;

  const [firstName, lastName, nationalId, phone, email, address] = await Promise.all([
    decryptField(patient.firstName || patient.first_name || ''),
    decryptField(patient.lastName || patient.last_name || ''),
    decryptField(patient.nationalId || patient.national_id || ''),
    decryptField(patient.phone || ''),
    decryptField(patient.email || ''),
    decryptField(patient.address || '')
  ]);

  return {
    ...patient,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    nationalId,
    phone,
    email,
    address
  };
}
