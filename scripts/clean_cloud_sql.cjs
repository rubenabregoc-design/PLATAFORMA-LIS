const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'supabase', 'FULL_CLOUD_SCHEMA_CONSOLIDATED.sql');
let content = fs.readFileSync(filePath, 'utf8');

// Remove any psql meta-commands (like \restrict, \unrestrict, \connect, etc.)
content = content.replace(/^\\.*$/gm, '');

// Ensure header is only present once
const header = `-- ============================================================================
-- 🚀 ABREGOTECH LISCORE — ESQUEMA CONSOLIDADO SUPABASE CLOUD (82 TABLAS)
-- ============================================================================
-- Contiene: 39 migraciones clínicas, índices compuestos de alto rendimiento,
-- disparadores de auditoría ISO 15189 y seguridad RLS multi-tenant.
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

`;

// Strip any existing header first if present
content = content.replace(/^-- =+[\s\S]*?CREATE EXTENSION IF NOT EXISTS pgcrypto;\s*/, '');

// Comment out CREATE SCHEMA public if present
content = content.replace(/^CREATE SCHEMA public;/gm, '-- CREATE SCHEMA IF NOT EXISTS public;');

// Trim whitespace and remove trailing empty lines
content = content.trim();

fs.writeFileSync(filePath, header + content + '\n', 'utf8');
console.log('✓ SQL consolidado sanitizado exitosamente en:', filePath);
console.log('✓ Tamaño final:', (fs.statSync(filePath).size / 1024).toFixed(2), 'KB');
