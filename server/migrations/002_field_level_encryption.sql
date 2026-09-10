-- ==============================================================================
-- AbregoTech LIS/HIS — Migración 002: Cifrado de Nivel de Campo (Ley 81 Panamá)
-- ==============================================================================

-- 1. Soporte de Hash Ciego (Blind Index) para búsqueda exacta sin desencriptar
ALTER TABLE IF EXISTS patients 
ADD COLUMN IF NOT EXISTS national_id_hash VARCHAR(64);

-- Índice B-Tree ultra rápido para búsqueda por cédula/pasaporte en 1 ms
CREATE INDEX IF NOT EXISTS idx_patients_national_id_hash 
ON patients(national_id_hash);

-- Flag de estado de cifrado para el registro
ALTER TABLE IF EXISTS patients 
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE;

-- 2. Campos protegidos para Pruebas Clínicas Confidenciales (VIH, Genética, Drogas)
ALTER TABLE IF EXISTS test_results 
ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS test_results 
ADD COLUMN IF NOT EXISTS confidential_notes TEXT;

-- 3. Habilitar extensión pgcrypto de PostgreSQL si se desea cifrado nativo en servidor
CREATE EXTENSION IF NOT EXISTS pgcrypto;

COMMENT ON COLUMN patients.national_id_hash IS 'HMAC-SHA256 Blind Index de la cédula para búsqueda instantánea Ley 81';
COMMENT ON COLUMN patients.is_encrypted IS 'Indica si los datos PII del paciente están cifrados con AES-256-GCM';
COMMENT ON COLUMN test_results.is_confidential IS 'Marca de secreto médico reforzado para diagnósticos estigmatizantes';
